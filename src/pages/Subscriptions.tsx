import { useState, useEffect } from "react";
import { History, Calendar, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, Zap, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDate } from "../lib/formatters";
import { motion } from "motion/react";
import Swal from "sweetalert2";

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  const fetchSubscriptions = () => {
    fetch("/api/admin/subscriptions")
      .then(res => res.json())
      .then(setSubs);
  };

  useEffect(() => {
    fetchSubscriptions();
    
    fetch("/api/admin/companies")
      .then(res => res.json())
      .then(data => {
        const mapping: Record<string, string> = {};
        data.forEach((c: any) => mapping[c.id] = c.name);
        setCompanies(mapping);
      });
  }, []);

  const handleAction = async (id: string, action: string) => {
    const result = await Swal.fire({
      title: "Confirmar Ação",
      text: `Deseja realmente ${action} esta subscrição?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      // Simulando a ação
      Swal.fire({
        icon: "success",
        title: "Ação Realizada!",
        text: `Subscrição ${action} com sucesso`,
        confirmButtonColor: "#2563eb",
        timer: 1500,
        showConfirmButton: false
      });
      fetchSubscriptions();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível realizar a ação",
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
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
          <button className="px-6 py-2.5 text-xs font-black uppercase bg-slate-900 text-white rounded-xl tracking-[0.1em]">Ativas</button>
          <button className="px-6 py-2.5 text-xs font-black uppercase text-slate-500 hover:text-primary-600 rounded-xl tracking-[0.1em]">Todas</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {subs.map(sub => (
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
                    <h4 className="text-xl font-bold text-slate-900">{companies[sub.companyId] || `Empresa #${sub.companyId}`}</h4>
                    {sub.isTrial && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Trial</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    <span className="bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">ID: {sub.id}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fim: {formatDate(sub.endDate)}</span>
                    <span className="flex items-center gap-1.5 text-primary-500"><Settings className="w-3.5 h-3.5" /> Plano {sub.planId === 'p1' ? 'Mensal' : sub.planId === 'p2' ? 'Semestral' : 'Anual'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 xl:gap-12 ml-auto">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Faturação</p>
                   <SubscriptionStatus status={sub.status} />
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAction(sub.id, "renovar")}
                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Renovar
                  </button>
                  <button 
                    onClick={() => handleAction(sub.id, "mudar plano")}
                    className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
                  >
                    Mudar Plano
                  </button>
                  <button 
                    onClick={() => handleAction(sub.id, sub.status === 'active' ? 'suspender' : 'ativar')}
                    className={`p-3.5 border rounded-2xl transition-all ${
                      sub.status === 'active' ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {sub.status === 'active' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionStatus({ status }: { status: string }) {
  const styles: any = {
    active: { icon: CheckCircle2, label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    expired: { icon: XCircle, label: "Expirada", color: "text-rose-600 bg-rose-50 border-rose-100" },
    suspended: { icon: AlertTriangle, label: "Suspensa", color: "text-orange-600 bg-orange-50 border-orange-100" },
    pending: { icon: Clock, label: "Pendente", color: "text-amber-600 bg-amber-50 border-amber-100" },
  };
  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${style.color}`}>
      <Icon className="w-4 h-4" />
      {style.label}
    </div>
  );
}
