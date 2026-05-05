import { useState, useEffect } from "react";
import { 
  Building2, 
  Users as UsersIcon, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Bell,
  Search,
  ChevronRight,
  Filter
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
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
          <p className="text-slate-500 mt-1">Bem-vindo ao centro de comando Salya.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-primary-500 transition-colors relative"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-6"
                >
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-4">Notificações</h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Nova empresa registada</p>
                      <p className="text-[10px] text-slate-500 mt-1">Alpha Business S.A acabou de entrar.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-800">Pagamento Confirmado</p>
                      <p className="text-[10px] text-slate-500 mt-1">Kz 100.000,00 recebidos de TechLda.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
            <button className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl">Hoje</button>
            <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Este Mês</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 grid-rows-6 gap-6 min-h-[900px]">
        {/* Metric Card 1: Revenue - col-span-4 row-span-2 */}
        <div className="col-span-12 lg:col-span-4 row-span-2 bento-card p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Receita Mensal (Faturamento)</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">
              {formatCurrency(metrics.monthlyRevenue)}
            </h3>
            <div className="mt-2 inline-flex items-center text-emerald-600 text-xs font-bold gap-1">
              <TrendingUp className="w-3 h-3" /> +15.3% vs mês passado
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
        </div>

        {/* Metric Card 2: Active Companies - col-span-4 row-span-1 */}
        <div 
          onClick={() => navigate("/companies")}
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 bento-card p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-colors"
        >
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Empresas Ativas</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.totalCompanies}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric Card 3: Active Trials - col-span-4 row-span-1 */}
        <div 
          onClick={() => navigate("/subscriptions")}
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 bento-card p-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 transition-colors"
        >
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Trials Ativos</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.activeTrials}</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl border border-orange-100 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Summary Card - col-span-8 row-span-1 */}
        <div className="col-span-12 lg:col-span-8 row-span-1 bento-card-dark flex items-center justify-around">
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
        </div>

        {/* Recent Activity Table - col-span-9 row-span-3 */}
        <div className="col-span-12 lg:col-span-9 row-span-4 bento-card p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Empresas Recém Registadas</h4>
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1 text-[10px] font-bold text-slate-500 gap-2 cursor-pointer hover:bg-slate-100">
                <Filter className="w-3 h-3" /> Filtrar Mês
              </div>
            </div>
            <button 
              onClick={() => navigate("/companies")}
              className="text-primary-600 text-xs font-bold hover:underline tracking-widest uppercase flex items-center gap-1"
            >
              Ver Todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                <tr>
                  <th className="pb-4">Empresa</th>
                  <th className="pb-4">Plano</th>
                  <th className="pb-4">Data Registro</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[1, 2, 3].map(idx => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center font-black text-primary-600 text-xs shadow-sm">
                          {idx === 1 ? 'A' : idx === 2 ? 'B' : 'G'}
                        </div>
                        <span className="font-bold text-slate-900">{idx === 1 ? 'Alpha Tech' : idx === 2 ? 'Beta Solutions' : 'Gamma Corp'}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase">
                        {idx === 1 ? 'Anual' : idx === 2 ? 'Mensal' : 'Semestral'}
                      </span>
                    </td>
                    <td className="py-5 text-sm text-slate-400 font-medium">12 Abr, 2024</td>
                    <td className="py-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        idx === 3 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {idx === 3 ? 'SUSPENSO' : 'ATIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Sidebar - col-span-3 row-span-3 */}
        <div className="col-span-12 lg:col-span-3 row-span-4 bento-card p-6 flex flex-col gap-6 font-sans">
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2 italic-none">
            <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div> Audit Logs
          </h4>
          <div className="flex-1 space-y-6 overflow-hidden italic-none">
             {[
               { id: 1, action: "Admin Login", performedBy: "SuperAdmin" },
               { id: 2, action: "Empresa Suspensa: Gamma Corp", performedBy: "SuperAdmin" },
               { id: 3, action: "Nova Subscrição: Beta", performedBy: "Sistema" }
             ].map((log, i) => (
               <div key={log.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate("/logs")}>
                 <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 ring-4 ring-primary-50 group-hover:scale-125 transition-transform"></div>
                 <div>
                   <p className="text-sm text-slate-800 font-bold leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tighter">{log.action}</p>
                   <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                    {log.performedBy} • {i*2}m atrás
                   </p>
                 </div>
               </div>
             ))}
          </div>
          <button 
            onClick={() => navigate("/logs")}
            className="w-full py-4 bg-slate-50 hover:bg-primary-50 rounded-2xl text-slate-600 hover:text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-slate-100 italic-none"
          >
            Ver Histórico Completo
          </button>
        </div>
      </div>
    </div>
  );
}
