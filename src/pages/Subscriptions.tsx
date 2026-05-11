import { useState, useEffect } from "react";
import { History, Calendar, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, Zap, Settings, RefreshCw, AlertTriangle, Package, X } from "lucide-react";
import { formatDate, formatCurrency } from "../lib/formatters";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";
import { useNavigate } from "react-router-dom";

const FILTER_MODES = [
  { id: 'ATIVA', label: 'Ativas' },
  { id: 'PENDENTE_APROVACAO', label: 'Pendentes' },
  { id: 'EXPIRADA', label: 'Expiradas' },
  { id: 'ALL', label: 'Todas' }
] as const;

type FilterMode = (typeof FILTER_MODES)[number]['id'];

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('ATIVA');

  useEffect(() => {
    document.title = "Subscrições | Salya Admin";
    
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('admin_token');
    console.log('Token no localStorage:', token ? 'presente' : 'ausente');
    
    if (!token) {
      console.log('Nenhum token encontrado, redirecionando para login');
      navigate('/login');
      return;
    }
    
    // Carregar dados
    fetchSubscriptions();
    fetchCompanies();
    fetchPlans();
  }, [navigate]);

  const fetchSubscriptions = () => {
    apiGet("/admin/subscriptions")
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Token inválido ou expirado
            localStorage.removeItem('admin_token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSubs(data);
        } else {
          console.error('Expected array from subscriptions API, got:', data);
          setSubs([]);
        }
      })
      .catch(error => {
        console.error('Failed to fetch subscriptions:', error);
        setSubs([]);
      });
  };

  const fetchCompanies = () => {
    apiGet("/admin/companies")
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('admin_token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const mapping: Record<string, string> = {};
          data.forEach((c: any) => mapping[c.id] = c.name);
          setCompanies(mapping);
        } else {
          console.error('Expected array from companies API, got:', data);
          setCompanies({});
        }
      })
      .catch(error => {
        console.error('Failed to fetch companies:', error);
        setCompanies({});
      });
  };

  const fetchPlans = () => {
    apiGet("/admin/plans")
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('admin_token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPlans(data);
        } else {
          console.error('Expected array from plans API, got:', data);
          setPlans([]);
        }
      })
      .catch(error => {
        console.error('Failed to fetch plans:', error);
        setPlans([]);
      });
  };

  const getPlanLabel = (sub: any) => {
    if (sub.planName) return sub.planName;
    const plan = plans.find((p) => String(p.id) === String(sub.planId));
    if (plan) return plan.name;
    if (sub.planId === 'p0') return 'Demo';
    if (sub.planId === 'p1') return 'Básico';
    if (sub.planId === 'p2') return 'Pro';
    if (sub.planId === 'p3') return 'Empresarial';
    return sub.planId;
  };

  const filteredSubs = (subs && Array.isArray(subs) ? subs : []).filter((sub) => {
    if (filterMode === 'ATIVA') return sub.status === 'ATIVA';
    if (filterMode === 'PENDENTE_APROVACAO') return sub.status === 'PENDENTE_APROVACAO';
    if (filterMode === 'EXPIRADA') return sub.status === 'EXPIRADA';
    return true;
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchCompanies();
    fetchPlans();
  }, []);

  const handleChangePlan = async (subscription: any) => {
    setSelectedSubscription(subscription);
    setSelectedPlan(subscription.planId);
    setShowChangePlanModal(true);
  };

  const handleRenew = async (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowRenewModal(true);
  };

  const confirmChangePlan = async () => {
    if (!selectedSubscription || !selectedPlan) return;

    setIsLoading(true);
    try {
      const res = await apiPost(`/admin/subscriptions/${selectedSubscription.id}/change-plan`, { planId: selectedPlan });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Plano Alterado!",
          text: "O plano da subscrição foi atualizado com sucesso",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false
        });
        setShowChangePlanModal(false);
        fetchSubscriptions();
      } else {
        throw new Error('Failed to change plan');
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível alterar o plano",
        confirmButtonColor: "#ef4444"
      });
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
        Swal.fire({
          icon: "success",
          title: "Subscrição Renovada!",
          text: "A subscrição foi renovada com sucesso",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false
        });
        setShowRenewModal(false);
        fetchSubscriptions();
      } else {
        throw new Error('Failed to renew');
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível renovar a subscrição",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await Swal.fire({
      title: "Confirmar Aprovação",
      text: "Deseja aprovar esta subscrição?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Sim, aprovar!"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/subscriptions/${id}/approve`, {});
      if (res.ok) {
        fetchSubscriptions();
        Swal.fire({ icon: "success", title: "Aprovada!", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro ao aprovar" });
    }
  };

  const handleReject = async (id: string) => {
    const result = await Swal.fire({
      title: "Confirmar Rejeição",
      text: "Deseja rejeitar esta subscrição?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sim, rejeitar"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/subscriptions/${id}/reject`, {});
      if (res.ok) {
        fetchSubscriptions();
        Swal.fire({ icon: "success", title: "Rejeitada!", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro ao rejeitar" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ATIVA' ? 'CANCELADA' : 'ATIVA';
    const actionText = newStatus === 'ATIVA' ? 'ativar' : 'cancelar';

    const result = await Swal.fire({
      title: "Confirmar Ação",
      text: `Deseja realmente ${actionText} esta subscrição?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/subscriptions/${id}/status`, { status: newStatus });

      if (res.ok) {
        fetchSubscriptions();
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: `Subscrição ${actionText} com sucesso`,
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível atualizar o status",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Gestão de Subscrições</h1>
          <p className="text-slate-500 mt-1">Controle de ciclos, renovações e ativações globais.</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl border border-slate-200">
          {FILTER_MODES.map((option) => (
            <button
              key={option.id}
              onClick={() => setFilterMode(option.id)}
              className={`px-5 py-2.5 text-xs font-black uppercase rounded-xl tracking-[0.1em] transition-all ${filterMode === option.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-500 hover:text-primary-600 bg-slate-50 hover:bg-slate-100'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredSubs.map(sub => (
          <motion.div 
            layout
            key={sub.id} 
            className="bento-card p-6 md:p-8 hover:border-primary-200 transition-all group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${sub.isTrial ? 'bg-amber-50 text-amber-600 shadow-amber-500/10' : 'bg-primary-50 text-primary-600 shadow-primary-500/10'}`}>
                  {sub.isTrial ? <Zap className="w-8 h-8" /> : <CreditCard className="w-8 h-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xl font-bold text-slate-900">{sub.userName} ({sub.userEmail})</h4>
                    {sub.isTrial && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Trial</span>}
                  </div>
                  <div className="text-sm font-medium text-slate-600 mb-2">
                    Entidade: {sub.companyName || companies[sub.companyId] || `Empresa #${sub.companyId}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    <span className="bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">SUB ID: {sub.id}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fim: {formatDate(sub.endDate)}</span>
                    <span className="flex items-center gap-1.5 text-primary-500">
                      <Settings className="w-3.5 h-3.5" /> {getPlanLabel(sub)} 
                      {sub.durationDays && <span className="ml-1 text-[10px] text-slate-300">({sub.durationDays} dias)</span>}
                    </span>
                    {sub.price && <span className="flex items-center gap-1.5 text-emerald-500"><CreditCard className="w-3.5 h-3.5" /> {formatCurrency(sub.price)}</span>}
                  </div>
                </div>
              </div>

                 <div className="flex flex-wrap items-center gap-8 xl:gap-12 ml-auto">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Faturação</p>
                    <SubscriptionStatus status={sub.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {sub.status === 'PENDENTE_APROVACAO' ? (
                      <>
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(sub.id)}
                          className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRenew(sub)}
                          className="px-6 py-3.5 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Renovar
                        </button>
                        <button
                          onClick={() => handleChangePlan(sub)}
                          className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
                        >
                          <Settings className="w-3.5 h-3.5" /> Mudar Plano
                        </button>
                        <button
                          onClick={() => handleToggleStatus(sub.id, sub.status)}
                          className={`p-3.5 border rounded-2xl transition-all ${
                            sub.status === 'ATIVA' ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={sub.status === 'ATIVA' ? 'Cancelar' : 'Ativar'}
                        >
                          {sub.status === 'ATIVA' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {showChangePlanModal && selectedSubscription && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                        {companies[selectedSubscription.companyId] || 'Empresa'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChangePlanModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
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
                              ? 'border-primary-500 bg-primary-50 shadow-md'
                              : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                plan.id === 'p1' ? 'bg-emerald-100 text-emerald-600' :
                                plan.id === 'p2' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                <Package className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{plan.name}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">
                                  {plan.durationDays} dias
                                </p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlan === plan.id
                                ? 'border-primary-500 bg-primary-500 text-white'
                                : 'border-slate-300'
                            }`}>
                              {selectedPlan === plan.id && <ChevronRight className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-lg font-black text-primary-600 mt-2">
                            {formatCurrency(plan.price)}
                          </p>
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
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                      Deseja renovar a subscrição de <span className="font-bold text-slate-700">{companies[selectedSubscription.companyId] || 'Empresa'}</span>?
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Plano atual</span>
                      <span className="font-bold text-slate-900">
                        {getPlanLabel(selectedSubscription)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-slate-500">Vencimento atual</span>
                      <span className="font-mono text-slate-700">{formatDate(selectedSubscription.endDate)}</span>
                    </div>
                    <hr className="my-3 border-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold">Nova data de vencimento</span>
                      <span className="font-black text-primary-600">
                        {formatDate(new Date(new Date(selectedSubscription.endDate).setDate(new Date(selectedSubscription.endDate).getDate() + 
                          (selectedSubscription.durationDays || (selectedSubscription.planId === 'p1' ? 30 : selectedSubscription.planId === 'p2' ? 180 : 365))
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
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
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
    ATIVA: { icon: CheckCircle2, label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    EXPIRADA: { icon: XCircle, label: "Expirada", color: "text-rose-600 bg-rose-50 border-rose-100" },
    CANCELADA: { icon: AlertTriangle, label: "Cancelada", color: "text-orange-600 bg-orange-50 border-orange-100" },
    PENDENTE_APROVACAO: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
  };
  const style = styles[status] || styles.PENDENTE_APROVACAO;
  const Icon = style.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${style.color}`}>
      <Icon className="w-4 h-4" />
      {style.label}
    </div>
  );
}
