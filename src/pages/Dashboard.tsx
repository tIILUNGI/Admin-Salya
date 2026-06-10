import { useState, useEffect } from "react";
import { TrendingUp, Building2, Clock, DollarSign, Users, CheckCircle2, AlertTriangle, RefreshCw, Activity, BarChart3, CreditCard, History, Package, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import { apiGet } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard | Salya Admin";
  }, []);

  useEffect(() => {
    apiGet("/admin/dashboard")
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        console.error("Erro ao carregar dashboard:", err);
        setData({
          metrics: {
            totalCompanies: 0,
            totalUsers: 0,
            activeSubscriptions: 0,
            expiredSubscriptions: 0,
            monthlyRevenue: 0,
            annualRevenue: 0,
            activeTrials: 0,
            pendingPayments: 0,
            companiesByPlan: { Semestral: 0, Anual: 0 }
          },
          revenueChart: [],
          paymentsChart: [],
          companiesByPlanChart: []
        });
      });
  }, []);

  const isLoading = !data;
  const metrics = data?.metrics || {
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    activeTrials: 0,
    pendingPayments: 0
  };
  const revenueChart = data?.revenueChart || [];
  const companiesByPlanChart = data?.companiesByPlanChart || [];

  const StatCard = ({ title, value, icon, trend, onClick, colorClass }: { title: string; value: string | number; icon: React.ReactNode; trend?: string; onClick?: () => void; colorClass: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`enterprise-card p-5 md:p-6 cursor-pointer group ${onClick ? 'hover:border-slate-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className={`p-2.5 rounded-xl ${colorClass} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl md:text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-none">{value}</h3>
      {trend && (
        <p className="text-xs font-semibold text-emerald-600 mt-3 flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5" />
          {trend}
        </p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-[1.7rem] font-extrabold text-slate-900 tracking-tight uppercase">Centro de Comando</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Visão completa do ecossistema Salya</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-700 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Métricas Principais */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            title="Receita Mensal"
            value={formatCurrency(metrics.monthlyRevenue)}
            icon={<DollarSign className="w-5 h-5 text-primary-600" />}
            trend="+12.5% este mês"
            colorClass="bg-primary-50 text-primary-600"
          />
          <StatCard
            title="Empresas"
            value={metrics.totalCompanies}
            icon={<Building2 className="w-5 h-5 text-emerald-600" />}
            onClick={() => navigate("/companies")}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Usuários"
            value={metrics.totalUsers}
            icon={<Users className="w-5 h-5 text-primary-600" />}
            onClick={() => navigate("/users")}
            colorClass="bg-primary-50 text-primary-600"
          />
          <StatCard
            title="Subs. Ativas"
            value={metrics.activeSubscriptions}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            onClick={() => navigate("/subscriptions")}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Trials"
            value={metrics.activeTrials}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            onClick={() => navigate("/subscriptions")}
            colorClass="bg-amber-50 text-amber-600"
          />
          <StatCard
            title="Pendentes"
            value={metrics.pendingPayments || 0}
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            onClick={() => navigate("/payments")}
            colorClass="bg-rose-50 text-rose-600"
          />
        </div>
      )}

      {/* Resumo Financeiro */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="enterprise-card-dark"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">Resumo Financeiro</h3>
                <p className="text-slate-300 text-xs font-medium mt-1.5 uppercase tracking-widest">Consolidado de receitas em tempo real</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-5">
                <p className="text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">Receita Mensal</p>
                <p className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(metrics.monthlyRevenue)}</p>
                <p className="text-emerald-300 text-[10px] font-bold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12.5%
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-5">
                <p className="text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">Receita Total</p>
                <p className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(metrics.annualRevenue)}</p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-5">
                <p className="text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">Subs. Activas</p>
                <p className="text-2xl font-extrabold text-white tracking-tight">{metrics.activeSubscriptions}</p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-5">
                <p className="text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">Expiradas</p>
                <p className="text-2xl font-extrabold text-rose-300 tracking-tight">{metrics.expiredSubscriptions}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => navigate("/payments")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all">
                <CreditCard className="w-3.5 h-3.5" /> Pagamentos
              </button>
              <button onClick={() => navigate("/subscriptions")} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-white border border-emerald-400/20 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all">
                <History className="w-3.5 h-3.5" /> Subscrições
              </button>
              <button onClick={() => navigate("/companies")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all">
                <Package className="w-3.5 h-3.5" /> Planos
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gráficos */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="enterprise-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evolução de Receita</h3>
                <p className="text-slate-400 text-xs mt-1">Últimos 6 meses</p>
              </div>
              <DollarSign className="w-5 h-5 text-primary-500" />
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" tickFormatter={(v) => v / 1000 + 'k'} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Receita"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2.5} fill="url(#colorRev)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="enterprise-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Empresas por Plano</h3>
                <p className="text-slate-400 text-xs mt-1">Distribuição actual</p>
              </div>
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={companiesByPlanChart}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, "Empresas"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Última Linha — Atividade e Ações Rápidas */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 enterprise-card p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Atividade Recente</h3>
                <p className="text-slate-400 text-xs mt-1">Últimas acções no sistema</p>
              </div>
              <button onClick={() => navigate("/logs")} className="text-primary-600 hover:text-primary-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                Ver Todos <Activity className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-bold text-xs truncate">Nova empresa cadastrada no sistema</p>
                    <p className="text-slate-400 text-[10px] font-medium mt-0.5">há {i * 12} minutos</p>
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest hidden sm:inline-block">Novo</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="enterprise-card p-6 md:p-8 flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-6">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[
                { icon: Building2, label: "Nova Empresa", bgClass: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100/60", iconClass: "bg-emerald-100 text-emerald-600", labelClass: "text-emerald-700", path: "/companies" },
                { icon: Users, label: "Novo USer", bgClass: "bg-primary-50 hover:bg-primary-100 border-primary-100/60", iconClass: "bg-primary-100 text-primary-600", labelClass: "text-primary-700", path: "/users" },
                { icon: History, label: "Subs.", bgClass: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100/60", iconClass: "bg-emerald-100 text-emerald-600", labelClass: "text-emerald-700", path: "/subscriptions" },
                { icon: CreditCard, label: "Pagamento", bgClass: "bg-amber-50 hover:bg-amber-100 border-amber-100/60", iconClass: "bg-amber-100 text-amber-600", labelClass: "text-amber-700", path: "/payments" },
                { icon: Package, label: "Planos", bgClass: "bg-primary-50 hover:bg-primary-100 border-primary-100/60", iconClass: "bg-primary-100 text-primary-600", labelClass: "text-primary-700", path: "/plans" },
                { icon: Activity, label: "Logs", bgClass: "bg-slate-50 hover:bg-slate-100 border-slate-100/60", iconClass: "bg-slate-100 text-slate-600", labelClass: "text-slate-700", path: "/logs" },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 ${action.bgClass} rounded-xl transition-all group border`}
                >
                  <div className={`w-10 h-10 ${action.iconClass} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-[9px] font-extrabold ${action.labelClass} uppercase tracking-widest text-center leading-tight`}>{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
