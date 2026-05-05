import { useState, useEffect } from "react";
import { 
  Building2, 
  Users as UsersIcon, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Search,
  ChevronRight,
  Filter
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>;

  const { metrics, revenueChart } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Dashboard Global</h1>
          <p className="text-slate-500 mt-1">Bem-vindo ao centro de comando Salya Admin.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 grid-rows-6 gap-6 min-h-[900px]">
        {/* Metric Card 1: Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-4 row-span-2 bento-card p-6 flex flex-col justify-between overflow-hidden relative group"
        >
          <div className="relative z-10">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Receita Mensal</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">
              {formatCurrency(metrics.monthlyRevenue)}
            </h3>
            <div className="mt-2 inline-flex items-center text-emerald-600 text-xs font-bold gap-1">
              <TrendingUp className="w-3 h-3" />
              +15.3% vs mês passado
            </div>
          </div>
          <div className="h-40 -mx-6 -mb-6 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Metric Card 2: Active Companies */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate("/companies")}
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 bento-card p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all"
        >
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Empresas Ativas</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.totalCompanies}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric Card 3: Active Trials */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate("/subscriptions")}
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 bento-card p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-all"
        >
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Trials Ativos</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.activeTrials}</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl border border-orange-100 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-12 lg:col-span-8 row-span-1 bento-card-dark flex items-center justify-around"
        >
          <div className="text-center group cursor-pointer" onClick={() => navigate("/subscriptions")}>
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Subscrições</p>
            <p className="text-2xl font-black">{metrics.activeSubscriptions}</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-center group cursor-pointer" onClick={() => navigate("/subscriptions")}>
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Expiradas</p>
            <p className="text-2xl font-black text-rose-300">{metrics.expiredSubscriptions}</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-center group cursor-pointer" onClick={() => navigate("/users")}>
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Usuários</p>
            <p className="text-2xl font-black">{metrics.totalUsers}</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-center group cursor-pointer" onClick={() => navigate("/companies")}>
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inativas</p>
            <p className="text-2xl font-black text-amber-300">{metrics.totalCompanies - metrics.activeSubscriptions}</p>
          </div>
        </motion.div>

        {/* Recent Activity Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-12 lg:col-span-8 row-span-2 bento-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900 font-bold text-lg">Atividade Recente</h3>
            <button 
              onClick={() => navigate("/logs")}
              className="text-sm text-primary-600 hover:text-primary-700 font-bold uppercase tracking-wider"
            >
              Ver Todos
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-bold text-sm">Nova empresa Beta Solutions adicionada</p>
                  <p className="text-slate-400 text-xs">2 minutos atrás</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Novo</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="col-span-12 lg:col-span-4 row-span-2 bento-card p-6"
        >
          <h3 className="text-slate-900 font-bold text-lg mb-6">Ações Rápidas</h3>
          <div className="space-y-3">
            {[
              { icon: Building2, label: "Nova Empresa", color: "emerald", path: "/companies" },
              { icon: UsersIcon, label: "Novo Usuário", color: "blue", path: "/users" },
              { icon: Clock, label: "Novo Plano", color: "purple", path: "/plans" },
              { icon: DollarSign, label: "Registrar Pagamento", color: "amber", path: "/payments" },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`w-full flex items-center gap-3 p-3 bg-${action.color}-50 hover:bg-${action.color}-100 rounded-xl transition-all group cursor-pointer border border-${action.color}-100`}
              >
                <div className={`w-8 h-8 bg-${action.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-4 h-4 text-${action.color}-600`} />
                </div>
                <span className={`text-sm font-bold text-${action.color}-700`}>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
