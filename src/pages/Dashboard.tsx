import { useState, useEffect } from "react";
import { TrendingUp, Building2, Clock, DollarSign, Users, CheckCircle2, AlertTriangle, RefreshCw, Activity, PieChart, BarChart3, CreditCard, History, Package } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard | Salya Admin";
  }, []);

  useEffect(() => {
    fetch("/api/admin/dashboard")
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
            companiesByPlan: { Mensal: 0, Semestral: 0, Anual: 0 }
          },
          revenueChart: [],
          paymentsChart: [],
          companiesByPlanChart: []
        });
      });
  }, []);

  if (!data) return (
    <div className="space-y-8 pb-12">
      <div className="animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-2xl mb-2" />
        <div className="h-4 w-96 bg-slate-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 rounded-2xl" />
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  const { metrics, revenueChart, paymentsChart, companiesByPlanChart } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">Dashboard Global</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Visão completa do sistema Salya em tempo real.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-600 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Métricas Principais - Grid Responsivo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {/* Receita Mensal */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex flex-col justify-between hover:shadow-lg transition-shadow relative overflow-hidden">
           <div>
             <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Receita Mensal</p>
             <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(metrics.monthlyRevenue)}</h3>
             <div className="mt-1 md:mt-2 inline-flex items-center text-emerald-600 text-[8px] md:text-xs font-bold gap-1">
               <TrendingUp className="w-3 h-3" />
               +15.3%
             </div>
           </div>
           <DollarSign className="w-8 h-8 text-primary-200 absolute bottom-4 right-4 opacity-50" />
         </motion.div>

        {/* Total Empresas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} onClick={() => navigate("/companies")} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all">
          <div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Empresas</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.totalCompanies}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2 md:p-3 rounded-xl border border-emerald-100 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </motion.div>

        {/* Total Usuários */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={() => navigate("/users")} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all">
          <div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Usuários</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.totalUsers}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2 md:p-3 rounded-xl border border-blue-100 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </motion.div>

        {/* Subscrições Ativas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} onClick={() => navigate("/subscriptions")} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all">
          <div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Ativas</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.activeSubscriptions}</p>
          </div>
          <div className="bg-primary-50 text-primary-600 p-2 md:p-3 rounded-xl border border-primary-100 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </motion.div>

        {/* Trials Ativos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onClick={() => navigate("/subscriptions")} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all">
          <div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Trials</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.activeTrials}</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2 md:p-3 rounded-xl border border-amber-100 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </motion.div>

        {/* Pagamentos Pendentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} onClick={() => navigate("/payments")} className="col-span-2 md:col-span-1 xl:col-span-1 bento-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all">
          <div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pendentes</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900">{metrics.pendingPayments || 0}</p>
          </div>
          <div className="bg-rose-50 text-rose-600 p-2 md:p-3 rounded-xl border border-rose-100 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </motion.div>
      </div>

      {/* Resumo Financeiro - Card Destacado */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bento-card-dark p-6 md:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Resumo Financeiro</h3>
              <p className="text-primary-100 text-xs md:text-sm mt-1">Consolidado de receitas e subscrições</p>
            </div>
            <PieChart className="w-8 h-8 text-primary-300 hidden md:block" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-5">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2">Receita Mensal</p>
              <p className="text-2xl md:text-3xl font-black text-white mb-1">{formatCurrency(metrics.monthlyRevenue)}</p>
              <div className="flex items-center gap-1 text-emerald-300 text-[8px] md:text-xs font-bold">
                <TrendingUp className="w-3 h-3" /> +15.3%
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-5">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2">Receita Anual</p>
              <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(metrics.annualRevenue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-5">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2">Subs. Activas</p>
              <p className="text-2xl md:text-3xl font-black text-white">{metrics.activeSubscriptions}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-5">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2">Expiradas</p>
              <p className="text-2xl md:text-3xl font-black text-rose-300">{metrics.expiredSubscriptions}</p>
            </div>
          </div>

          {/* Linha de separação */}
          <div className="border-t border-white/10 my-6" />

          {/* Estatísticas Adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Usuários</p>
              <p className="text-2xl md:text-3xl font-black text-white">{metrics.totalUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Empresas</p>
              <p className="text-2xl md:text-3xl font-black text-white">{metrics.totalCompanies}</p>
            </div>
            <div className="text-center">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Trials Activos</p>
              <p className="text-2xl md:text-3xl font-black text-amber-300">{metrics.activeTrials}</p>
            </div>
            <div className="text-center">
              <p className="text-primary-100 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pendentes</p>
              <p className="text-2xl md:text-3xl font-black text-rose-300">{metrics.pendingPayments || 0}</p>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex flex-wrap gap-2 md:gap-3 mt-6 pt-6 border-t border-white/10">
            <button onClick={() => navigate("/payments")} className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-white border border-primary-400/30 rounded-xl text-[8px] md:text-xs font-bold uppercase tracking-wider transition-all">
              <CreditCard className="w-3 h-3 md:w-4 md:h-4" /> Pagamentos
            </button>
            <button onClick={() => navigate("/subscriptions")} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-white border border-emerald-400/30 rounded-xl text-[8px] md:text-xs font-bold uppercase tracking-wider transition-all">
              <History className="w-3 h-3 md:w-4 md:h-4" /> Subscrições
            </button>
            <button onClick={() => navigate("/companies")} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-400/30 rounded-xl text-[8px] md:text-xs font-bold uppercase tracking-wider transition-all">
              <Building2 className="w-3 h-3 md:w-4 md:h-4" /> Empresas
            </button>
          </div>
        </div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bento-card p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">Evolução de Receita</h3>
              <p className="text-slate-400 text-xs md:text-sm">Últimos 5 meses</p>
            </div>
            <DollarSign className="w-6 h-6 text-primary-600 hidden md:block" />
          </div>
          <div className="h-64 md:h-80 w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => v / 1000 + 'k'} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Receita"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fill="url(#colorRev)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Distribuição por Plano */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bento-card p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">Empresas por Plano</h3>
              <p className="text-slate-400 text-xs md:text-sm">Distribuição actual</p>
            </div>
            <BarChart3 className="w-6 h-6 text-emerald-600 hidden md:block" />
          </div>
          <div className="h-64 md:h-80 w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={companiesByPlanChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip formatter={(value: number) => [value, "Empresas"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Última Linha - Atividade e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividade Recente */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="lg:col-span-2 bento-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">Atividade Recente</h3>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">Últimas acções no sistema</p>
            </div>
            <button onClick={() => navigate("/logs")} className="text-primary-600 hover:text-primary-700 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center gap-1">
              Ver Todos <Activity className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 md:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 md:gap-4 p-2 md:p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-bold text-xs md:text-sm truncate">Nova empresa cadastrada no sistema</p>
                  <p className="text-slate-400 text-[8px] md:text-xs">há {i * 12} minutos</p>
                </div>
                <span className="text-[8px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full hidden sm:inline-block">Novo</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ações Rápidas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bento-card p-6 flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4 md:mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3 flex-1">
            {[
              { icon: Building2, label: "Nova Empresa", color: "emerald", path: "/companies" },
              { icon: Users, label: "Novo User", color: "blue", path: "/users" },
              { icon: History, label: "Subs.", color: "purple", path: "/subscriptions" },
              { icon: CreditCard, label: "Pagamento", color: "amber", path: "/payments" },
              { icon: Package, label: "Planos", color: "rose", path: "/plans" },
              { icon: Activity, label: "Logs", color: "cyan", path: "/logs" },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-${action.color}-50 hover:bg-${action.color}-100 rounded-xl transition-all group border border-${action.color}-100`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-${action.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-5 h-5 md:w-6 md:h-6 text-${action.color}-600`} />
                </div>
                <span className={`text-[8px] md:text-xs font-bold text-${action.color}-700 text-center`}>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}