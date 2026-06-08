import { useState, useEffect } from "react";
import { Calendar, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, Zap, Settings, RefreshCw, AlertTriangle, Package, X, Users, Building2, Mail, Phone, MapPin, Hash } from "lucide-react";
import { formatDate, formatCurrency } from "../lib/formatters";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

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
        const mapping: Record<string, any> = {};
        (Array.isArray(data) ? data : []).forEach((c: any) => {
          mapping[String(c.id)] = c;
          if (c.userId) {
            mapping[String(c.userId)] = c;
          }
        });
        setCompanies(mapping);
      })
      .catch(() => {});

    apiGet("/admin/plans")
      .then(res => res.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

  const filteredSubs = showActiveOnly
    ? subs.filter(sub => sub.status === "active" || sub.status === "ATIVA")
    : subs;

  const sortedSubs = [...filteredSubs].sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const userGroups: Record<string, any[]> = {};
  const userOrder: string[] = [];
  sortedSubs.forEach(sub => {
    const uid = String(sub.userId ?? sub.user?.id ?? sub.id);
    if (!userGroups[uid]) {
      userGroups[uid] = [];
      userOrder.push(uid);
    }
    userGroups[uid].push(sub);
  });

  const toggleUser = (uid: string) => {
    setExpandedUsers(prev => ({ ...prev, [uid]: !prev[uid] }));
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
        Swal.fire({ icon: "success", title: "Plano Alterado!", text: "O plano foi atualizado com sucesso", confirmButtonColor: "#9333ea", timer: 1500, showConfirmButton: false });
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
        Swal.fire({ icon: "success", title: "Subscrição Renovada!", text: "A subscrição foi renovada com sucesso", confirmButtonColor: "#9333ea", timer: 1500, showConfirmButton: false });
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
      confirmButtonColor: "#9333ea",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/subscriptions/${id}/status`, { status: newStatus });
      if (res.ok) {
        fetchSubscriptions();
        Swal.fire({ icon: "success", title: "Sucesso!", text: `Subscrição ${actionText} com sucesso`, confirmButtonColor: "#9333ea", timer: 1500, showConfirmButton: false });
      } else throw new Error("Failed");
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível atualizar o status", confirmButtonColor: "#ef4444" });
    }
  };

  const getPlanLabel = (planId: string) => {
    if (planId === "p0") return "Demo";
    if (planId === "p1") return "Semestral";
    if (planId === "p2") return "Anual";
    return "Outro";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[1.7rem] font-extrabold text-slate-900 tracking-tight uppercase">Gestão de Subscrições</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">
            {userOrder.length} usuário{userOrder.length !== 1 ? "s" : ""} · {sortedSubs.length} subscrição{sortedSubs.length !== 1 ? "ões" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setShowActiveOnly(true)}
            className={`px-5 py-2.5 text-[10px] font-extrabold uppercase rounded-lg tracking-wider transition-all ${showActiveOnly ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-primary-600"}`}
          >
            Ativas
          </button>
          <button
            onClick={() => setShowActiveOnly(false)}
            className={`px-5 py-2.5 text-[10px] font-extrabold uppercase rounded-lg tracking-wider transition-all ${!showActiveOnly ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-primary-600"}`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* User Groups */}
      <div className="space-y-4">
        {userOrder.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 font-semibold text-sm">Nenhuma subscrição encontrada.</p>
          </div>
        )}

        {userOrder.map(uid => {
          const groupSubs = userGroups[uid];
          const latestSub = groupSubs[0];
          const isExpanded = expandedUsers[uid] !== false;

          const info = {
            name: latestSub?.companyName || companies[String(latestSub?.companyId)]?.name || `Empresa do Utilizador #${uid}`,
            employees: Number(latestSub?.employees ?? 0),
            companyId: latestSub?.companyId
          };

          const activeCount = groupSubs.filter(s => s.status === "active" || s.status === "ATIVA").length;

          return (
            <motion.div key={uid} layout className="enterprise-card overflow-hidden">
              <button
                onClick={() => toggleUser(uid)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 hover:bg-slate-50/40 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-base font-black shadow-sm">
                    {(latestSub?.companyName || info.name).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[1rem] font-extrabold text-slate-900 tracking-tight">{info.name}</h3>
                    {(latestSub?.userName || latestSub?.ownerName) && (
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                        Proprietário: <span className="text-slate-600 font-bold">{latestSub.userName || latestSub.ownerName}</span>
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-2.5 mt-2.5">
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
                        <Users className="w-3 h-3" />
                        {info.employees} colaborador{info.employees !== 1 ? "es" : ""}
                      </span>
                      {activeCount > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          {activeCount} ativa
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {groupSubs.length} histór{groupSubs.length !== 1 ? "ico" : "ico"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  {latestSub && (
                    <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-extrabold text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-md uppercase tracking-widest">
                      Plano {getPlanLabel(latestSub.planId)}
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 md:p-6 bg-slate-50/50 border-b border-slate-100">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-primary-500" />
                          Detalhes da Empresa
                        </h4>
                        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Nome Comercial:</span>
                            <span className="font-bold text-slate-900">{info.name}</span>
                          </div>
                          {companies[String(info.companyId)]?.nif && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">NIF:</span>
                              <span className="font-mono font-bold text-slate-700">{companies[String(info.companyId)].nif}</span>
                            </div>
                          )}
                          {(companies[String(info.companyId)]?.phone || companies[String(info.companyId)]?.email) && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Contacto:</span>
                              <span className="font-bold text-slate-700">{companies[String(info.companyId)]?.phone || companies[String(info.companyId)]?.email}</span>
                            </div>
                          )}
                          {companies[String(info.companyId)]?.address && (
                            <div className="flex justify-between items-start text-sm">
                              <span className="text-slate-500 font-medium mr-4">Endereço:</span>
                              <span className="font-bold text-slate-700 text-right">{companies[String(info.companyId)].address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          Dados do Proprietário
                        </h4>
                        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Nome do Gestor:</span>
                            <span className="font-bold text-slate-900">{latestSub?.userName || latestSub?.ownerName || "Não informado"}</span>
                          </div>
                          {latestSub?.userEmail && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Email:</span>
                              <span className="font-bold text-slate-700 select-all">{latestSub.userEmail}</span>
                            </div>
                          )}
                          {latestSub?.userPhone && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Telemóvel:</span>
                              <span className="font-bold text-slate-700">{latestSub.userPhone}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Colaboradores:</span>
                            <span className="px-2.5 py-1 bg-slate-100 rounded-md font-bold text-slate-700 text-xs">{info.employees}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupSubs.map((sub, idx) => (
                        <div
                          key={sub.id}
                          className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 px-5 md:px-6 py-5 hover:bg-slate-50/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-[10px] font-extrabold text-slate-500">#{groupSubs.length - idx}</span>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sub.isTrial ? "bg-amber-50 text-amber-600" : "bg-primary-50 text-primary-600"}`}>
                              {sub.isTrial ? <Zap className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-bold text-slate-800">Plano {getPlanLabel(sub.planId)}</span>
                                {idx === 0 && (
                                  <span className="bg-primary-100 text-primary-700 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">Recent</span>
                                )}
                                {sub.isTrial && (
                                  <span className="bg-amber-100 text-amber-700 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">Trial</span>
                                )}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                  ID: {sub.id}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 ml-auto lg:ml-0">
                            <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5" />
                              Fim: {formatDate(sub.endDate)}
                            </div>
                            <SubscriptionStatus status={sub.status} />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRenew(sub)}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.15em] shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-3 h-3" /> Renovar
                              </button>
                              <button
                                onClick={() => handleChangePlan(sub)}
                                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-[0.15em] shadow-lg shadow-primary-500/20 transition-all flex items-center gap-1.5"
                              >
                                <Settings className="w-3 h-3" /> Mudar
                              </button>
                              <button
                                onClick={() => handleToggleStatus(sub.id, sub.status)}
                                className={`p-2.5 border rounded-lg transition-all ${
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Mudar Plano</h3>
                      <p className="text-slate-500 text-sm mt-1.5">
                        {companies[String(selectedSubscription.companyId)]?.name || "Empresa"}
                      </p>
                    </div>
                    <button onClick={() => setShowChangePlanModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPlan === plan.id
                              ? "border-primary-500 bg-primary-50 shadow-sm"
                              : "border-slate-200 hover:border-primary-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                plan.id === "p1" ? "bg-emerald-100 text-emerald-600" :
                                plan.id === "p2" ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-600"
                              }`}>
                                <Package className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">Duração: {plan.durationDays} dias</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlan === plan.id ? "border-primary-500 bg-primary-500 text-white" : "border-slate-300"
                            }`}>
                              {selectedPlan === plan.id && <ChevronRight className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-lg font-extrabold text-primary-600 mt-2">{formatCurrency(plan.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setShowChangePlanModal(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmChangePlan}
                      disabled={isLoading || selectedPlan === selectedSubscription.planId}
                      className="flex-1 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      Confirmar
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Renovar Subscrição</h3>
                    <p className="text-slate-500 mt-2">
                      Renovar subscrição de <span className="font-bold text-slate-700">{companies[String(selectedSubscription.companyId)]?.name || "Empresa"}</span>?
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Plano atual</span>
                      <span className="font-bold text-slate-900">{getPlanLabel(selectedSubscription.planId)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-slate-500">Vencimento</span>
                      <span className="font-mono text-slate-700">{formatDate(selectedSubscription.endDate)}</span>
                    </div>
                    <hr className="my-3 border-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold">Nova data</span>
                      <span className="font-extrabold text-primary-600">
                        {formatDate(new Date(new Date(selectedSubscription.endDate).setDate(
                          new Date(selectedSubscription.endDate).getDate() +
                          (selectedSubscription.planId === "p1" ? 180 : selectedSubscription.planId === "p2" ? 365 : 30)
                        )).toISOString())}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRenewModal(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmRenewal}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmar
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
    suspended: { icon: AlertTriangle, label: "Suspensa", color: "text-amber-600 bg-amber-50 border-amber-100" },
    CANCELADA: { icon: AlertTriangle, label: "Suspensa", color: "text-amber-600 bg-amber-50 border-amber-100" },
    pending: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
    PENDENTE_APROVACAO: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
  };
  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-extrabold uppercase tracking-widest ${style.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </div>
  );
}
