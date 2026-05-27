import { useState, useEffect } from "react";
import { Calendar, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, Zap, Settings, RefreshCw, AlertTriangle, Package, X, Users, Building2 } from "lucide-react";
import { formatDate, formatCurrency } from "../lib/formatters";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, { name: string; employees: number }>>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "Subscrições | Salya Admin";
  }, []);

  const fetchSubscriptions = () => {
    apiGet("/admin/subscriptions")
      .then(res => res.json())
      .then(data => setSubs(Array.isArray(data) ? data : []))
      .catch(() => setSubs([]));
  };

  useEffect(() => {
    fetchSubscriptions();

    apiGet("/admin/companies")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const mapping: Record<string, { name: string; employees: number }> = {};
        data.forEach((c: any) => (mapping[String(c.id)] = { name: c.name || `Empresa #${c.id}`, employees: c.employees || 0 }));
        setCompanies(mapping);
      })
      .catch(() => {});

    apiGet("/admin/plans")
      .then(res => res.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

  // Sort subscriptions newest → oldest (by startDate or id)
  const filteredSubs = showActiveOnly
    ? subs.filter(sub => sub.status === "active" || sub.status === "ATIVA")
    : subs;

  const sortedSubs = [...filteredSubs].sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // Group by companyId — order of groups = order of most recent subscription per company
  const companyGroups: Record<string, any[]> = {};
  const companyOrder: string[] = [];
  sortedSubs.forEach(sub => {
    const cid = String(sub.companyId);
    if (!companyGroups[cid]) {
      companyGroups[cid] = [];
      companyOrder.push(cid);
    }
    companyGroups[cid].push(sub);
  });

  const toggleCompany = (cid: string) => {
    setExpandedCompanies(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  const handleChangePlan = (subscription: any) => {
    setSelectedSubscription(subscription);
    setSelectedPlan(subscription.planId);
    setShowChangePlanModal(true);
  };

  const handleRenew = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowRenewModal(true);
  };

  const confirmChangePlan = async () => {
    if (!selectedSubscription || !selectedPlan) return;
    setIsLoading(true);
    try {
      const res = await apiPost(`/admin/subscriptions/${selectedSubscription.id}/change-plan`, { planId: selectedPlan });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Plano Alterado!", text: "O plano foi atualizado com sucesso", confirmButtonColor: "#2563eb", timer: 1500, showConfirmButton: false });
        setShowChangePlanModal(false);
        fetchSubscriptions();
      } else throw new Error("Failed");
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível alterar o plano", confirmButtonColor: "#ef4444" });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRenewal = async () => {
    if (!selectedSubscription) return;
    setIsLoading(true);
    try {
      const res = await apiPost(`/admin/subscriptions/${selectedSubscription.id}/renew`, {});
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Subscrição Renovada!", text: "A subscrição foi renovada com sucesso", confirmButtonColor: "#2563eb", timer: 1500, showConfirmButton: false });
        setShowRenewModal(false);
        fetchSubscriptions();
      } else throw new Error("Failed");
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível renovar a subscrição", confirmButtonColor: "#ef4444" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isActive = currentStatus === "active" || currentStatus === "ATIVA";
    const newStatus = isActive ? "suspended" : "active";
    const actionText = isActive ? "suspender" : "ativar";

    const result = await Swal.fire({
      title: "Confirmar Ação",
      text: `Deseja realmente ${actionText} esta subscrição?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/subscriptions/${id}/status`, { status: newStatus });
      if (res.ok) {
        fetchSubscriptions();
        Swal.fire({ icon: "success", title: "Sucesso!", text: `Subscrição ${actionText} com sucesso`, confirmButtonColor: "#2563eb", timer: 1500, showConfirmButton: false });
      } else throw new Error("Failed");
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível atualizar o status", confirmButtonColor: "#ef4444" });
    }
  };

  const getPlanLabel = (planId: string) => {
    if (planId === "p1") return "Mensal";
    if (planId === "p2") return "Semestral";
    return "Anual";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Gestão de Subscrições</h1>
          <p className="text-slate-500 mt-1">
            {companyOrder.length} empresa{companyOrder.length !== 1 ? "s" : ""} · {sortedSubs.length} subscrição{sortedSubs.length !== 1 ? "ões" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setShowActiveOnly(true)}
            className={`px-6 py-2.5 text-xs font-black uppercase rounded-xl tracking-[0.1em] transition-all ${showActiveOnly ? "bg-slate-900 text-white" : "text-slate-500 hover:text-primary-600 bg-white"}`}
          >
            Ativas
          </button>
          <button
            onClick={() => setShowActiveOnly(false)}
            className={`px-6 py-2.5 text-xs font-black uppercase rounded-xl tracking-[0.1em] transition-all ${!showActiveOnly ? "bg-slate-900 text-white" : "text-slate-500 hover:text-primary-600 bg-white"}`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Company Groups */}
      <div className="space-y-6">
        {companyOrder.length === 0 && (
          <div className="bento-card p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Nenhuma subscrição encontrada.</p>
          </div>
        )}

        {companyOrder.map(cid => {
          const info = companies[cid] || { name: `Empresa #${cid}`, employees: 0 };
          const groupSubs = companyGroups[cid];
          const isExpanded = expandedCompanies[cid] !== false; // default open
          const activeCount = groupSubs.filter(s => s.status === "active" || s.status === "ATIVA").length;
          const latestSub = groupSubs[0];

          return (
            <motion.div key={cid} layout className="bento-card overflow-hidden">
              {/* Company Header */}
              <button
                onClick={() => toggleCompany(cid)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 md:p-8 hover:bg-slate-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-black shadow-sm">
                    {info.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{info.name}</h3>
                    <div className="flex items-center flex-wrap gap-3 mt-1">
                      {/* Employee count */}
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {info.employees} colaborador{info.employees !== 1 ? "es" : ""}
                      </span>
                      {/* Active badge */}
                      {activeCount > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {activeCount} ativa
                        </span>
                      )}
                      {/* Sub count */}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {groupSubs.length} histór{groupSubs.length !== 1 ? "icos" : "ico"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  {/* Latest plan badge */}
                  {latestSub && (
                    <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                      <Settings className="w-3 h-3" />
                      Plano {getPlanLabel(latestSub.planId)}
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </button>

              {/* Subscription History */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                      {groupSubs.map((sub, idx) => (
                        <div
                          key={sub.id}
                          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-6 md:px-8 py-5 hover:bg-slate-50/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Timeline number */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-[10px] font-black text-slate-500">#{groupSubs.length - idx}</span>
                            </div>

                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.isTrial ? "bg-amber-50 text-amber-600" : "bg-primary-50 text-primary-600"}`}>
                              {sub.isTrial ? <Zap className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-800">
                                  Plano {getPlanLabel(sub.planId)}
                                </span>
                                {idx === 0 && (
                                  <span className="bg-primary-100 text-primary-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    Mais Recente
                                  </span>
                                )}
                                {sub.isTrial && (
                                  <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    Trial
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-500">
                                  ID: {sub.id}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Fim: {formatDate(sub.endDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 ml-auto">
                            <SubscriptionStatus status={sub.status} />

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRenew(sub)}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-3 h-3" /> Renovar
                              </button>
                              <button
                                onClick={() => handleChangePlan(sub)}
                                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-primary-500/20 transition-all flex items-center gap-1.5"
                              >
                                <Settings className="w-3 h-3" /> Mudar Plano
                              </button>
                              <button
                                onClick={() => handleToggleStatus(sub.id, sub.status)}
                                className={`p-2.5 border rounded-xl transition-all ${
                                  sub.status === "active" || sub.status === "ATIVA"
                                    ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                    : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                                }`}
                                title={sub.status === "active" || sub.status === "ATIVA" ? "Suspender" : "Ativar"}
                              >
                                {sub.status === "active" || sub.status === "ATIVA"
                                  ? <AlertTriangle className="w-4 h-4" />
                                  : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {showChangePlanModal && selectedSubscription && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowChangePlanModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mudar Plano</h3>
                      <p className="text-slate-500 text-sm mt-1">
                        {companies[String(selectedSubscription.companyId)]?.name || "Empresa"}
                      </p>
                    </div>
                    <button onClick={() => setShowChangePlanModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 font-medium">Selecione o novo plano:</p>
                    <div className="grid grid-cols-1 gap-3">
                      {plans.map(plan => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-4 rounded-2xl border-2 transition-all text-left ${
                            selectedPlan === plan.id
                              ? "border-primary-500 bg-primary-50 shadow-md"
                              : "border-slate-200 hover:border-primary-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                plan.id === "p1" ? "bg-emerald-100 text-emerald-600" :
                                plan.id === "p2" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                              }`}>
                                <Package className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{plan.name}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{plan.durationDays} dias</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlan === plan.id ? "border-primary-500 bg-primary-500 text-white" : "border-slate-300"
                            }`}>
                              {selectedPlan === plan.id && <ChevronRight className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-lg font-black text-primary-600 mt-2">{formatCurrency(plan.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setShowChangePlanModal(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmChangePlan}
                      disabled={isLoading || selectedPlan === selectedSubscription.planId}
                      className="flex-1 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      Confirmar Mudança
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Renewal Modal */}
      <AnimatePresence>
        {showRenewModal && selectedSubscription && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRenewModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Renovar Subscrição</h3>
                    <p className="text-slate-500 mt-2">
                      Deseja renovar a subscrição de{" "}
                      <span className="font-bold text-slate-700">
                        {companies[String(selectedSubscription.companyId)]?.name || "Empresa"}
                      </span>?
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Plano atual</span>
                      <span className="font-bold text-slate-900">{getPlanLabel(selectedSubscription.planId)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-slate-500">Vencimento atual</span>
                      <span className="font-mono text-slate-700">{formatDate(selectedSubscription.endDate)}</span>
                    </div>
                    <hr className="my-3 border-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold">Nova data de vencimento</span>
                      <span className="font-black text-primary-600">
                        {formatDate(new Date(new Date(selectedSubscription.endDate).setDate(
                          new Date(selectedSubscription.endDate).getDate() +
                          (selectedSubscription.planId === "p1" ? 30 : selectedSubscription.planId === "p2" ? 180 : 365)
                        )).toISOString())}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRenewModal(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmRenewal}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmar Renovação
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubscriptionStatus({ status }: { status: string }) {
  const styles: any = {
    active: { icon: CheckCircle2, label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    ATIVA: { icon: CheckCircle2, label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    expired: { icon: XCircle, label: "Expirada", color: "text-rose-600 bg-rose-50 border-rose-100" },
    EXPIRADA: { icon: XCircle, label: "Expirada", color: "text-rose-600 bg-rose-50 border-rose-100" },
    suspended: { icon: AlertTriangle, label: "Suspensa", color: "text-orange-600 bg-orange-50 border-orange-100" },
    CANCELADA: { icon: AlertTriangle, label: "Suspensa", color: "text-orange-600 bg-orange-50 border-orange-100" },
    pending: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
    PENDENTE_APROVACAO: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
  };
  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${style.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </div>
  );
}
