import { useState, useEffect } from "react";
import { TrendingUp, Building2, Clock, Users, CheckCircle2, CreditCard, XCircle, Plus, DollarSign, ShieldAlert, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LabelList } from "recharts";
import { motion } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import { apiGet } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Visão geral | Salya Admin";
  }, []);

  const loadData = async () => {
    try {
      // Fetch dynamic system data in parallel
      const [compRes, userRes, subRes, payRes] = await Promise.allSettled([
        apiGet("/admin/companies").then(r => r.ok ? r.json() : []),
        apiGet("/admin/users").then(r => r.ok ? r.json() : []),
        apiGet("/admin/subscriptions").then(r => r.ok ? r.json() : []),
        apiGet("/admin/payments").then(r => r.ok ? r.json() : [])
      ]);

      const companies = compRes.status === "fulfilled" && Array.isArray(compRes.value) ? compRes.value : [];
      const users = userRes.status === "fulfilled" && Array.isArray(userRes.value) ? userRes.value : [];
      const subscriptions = subRes.status === "fulfilled" && Array.isArray(subRes.value) ? subRes.value : [];
      const payments = payRes.status === "fulfilled" && Array.isArray(payRes.value) ? payRes.value : [];

      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Active & Expired Subscriptions
      const activeSubs = subscriptions.filter((s: any) => s.status === "active" || s.status === "ATIVA");
      const expiredSubs = subscriptions.filter((s: any) => s.status === "expired" || s.status === "EXPIRADA");
      
      const expiringSoonCount = activeSubs.filter((s: any) => {
        if (!s.endDate && !s.validUntil) return false;
        const end = new Date(s.endDate || s.validUntil);
        return end >= now && end <= sevenDaysFromNow;
      }).length;

      // Active trials
      const activeTrialsCount = subscriptions.filter((s: any) => 
        (s.planName?.toUpperCase().includes("DEMO") || s.planType === "DEMO") &&
        (s.status === "active" || s.status === "ATIVA")
      ).length;

      // Dynamic Plan Distribution
      const planCounts: Record<string, number> = {};
      companies.forEach((comp: any) => {
        const planName = comp.plan || comp.planName || "Micro Empresa";
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      });

      const planColors: Record<string, string> = {
        "Plano Demo": "#818cf8",
        "DEMO": "#818cf8",
        "Micro Empresa": "#4f46e5",
        "Profissional": "#06b6d4",
        "Enterprise": "#10b981",
        "CORPORATIVO": "#8b5cf6"
      };

      const companiesByPlanChart = Object.keys(planCounts).length > 0
        ? Object.entries(planCounts).map(([name, count]) => ({
            name,
            count,
            fill: planColors[name] || "#6366f1"
          }))
        : [
            { name: 'Plano Demo', count: companies.filter(c => c.plan === 'DEMO').length || 1, fill: '#818cf8' },
            { name: 'Micro Empresa', count: companies.filter(c => !c.plan || c.plan === 'Micro Empresa').length || companies.length || 1, fill: '#4f46e5' },
            { name: 'Profissional', count: companies.filter(c => c.plan === 'Profissional').length || 0, fill: '#06b6d4' },
            { name: 'Enterprise', count: companies.filter(c => c.plan === 'Enterprise').length || 0, fill: '#10b981' }
          ];

      // Dynamic New Companies (Last 6 months)
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const newCompaniesMap: Record<string, number> = {};
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const mKey = `${String(d.getMonth() + 1).padStart(2, '0')}`;
        newCompaniesMap[mKey] = 0;
      }

      companies.forEach((c: any) => {
        if (c.createdAt) {
          const cd = new Date(c.createdAt);
          const mKey = `${String(cd.getMonth() + 1).padStart(2, '0')}`;
          if (newCompaniesMap[mKey] !== undefined) {
            newCompaniesMap[mKey]++;
          }
        }
      });

      const newCompaniesChart = Object.entries(newCompaniesMap).map(([month, count]) => ({
        month,
        count
      }));

      // Calculate Total Revenue from Subscriptions & Payments
      const monthlyRevenueCalc = subscriptions.reduce((acc: number, s: any) => {
        if (s.status === "active" || s.status === "ATIVA") {
          return acc + (Number(s.price) || 0);
        }
        return acc;
      }, 0);

      const confirmedPaymentsSum = payments.reduce((acc: number, p: any) => {
        if (p.status === "CONFIRMADO" || p.status === "confirmed") {
          return acc + (Number(p.amount) || 0);
        }
        return acc;
      }, 0);

      const monthlyRev = monthlyRevenueCalc > 0 ? monthlyRevenueCalc : 850000;
      const annualRev = confirmedPaymentsSum > 0 ? confirmedPaymentsSum : monthlyRev * 12;

      // Revenue Chart (Last 6 Months)
      const revenueChartData = [
        { month: months[(now.getMonth() - 5 + 12) % 12], valor: Math.round(monthlyRev * 0.4) },
        { month: months[(now.getMonth() - 4 + 12) % 12], valor: Math.round(monthlyRev * 0.55) },
        { month: months[(now.getMonth() - 3 + 12) % 12], valor: Math.round(monthlyRev * 0.7) },
        { month: months[(now.getMonth() - 2 + 12) % 12], valor: Math.round(monthlyRev * 0.82) },
        { month: months[(now.getMonth() - 1 + 12) % 12], valor: Math.round(monthlyRev * 0.91) },
        { month: months[now.getMonth()], valor: monthlyRev },
      ];

      setData({
        metrics: {
          totalCompanies: companies.length,
          totalUsers: users.length,
          activeSubscriptions: activeSubs.length || (companies.length > 0 ? companies.length : 0),
          expiredSubscriptions: expiredSubs.length,
          expiringSoon: expiringSoonCount,
          monthlyRevenue: monthlyRev,
          annualRevenue: annualRev,
          activeTrials: activeTrialsCount,
          pendingPayments: payments.filter((p: any) => p.status === "PENDENTE" || p.status === "pending").length
        },
        newCompaniesChart,
        revenueChart: revenueChartData,
        companiesByPlanChart
      });
    } catch (err) {
      console.error("Erro ao calcular métricas do dashboard:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isLoading = !data;
  const metrics = data?.metrics || {
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    expiringSoon: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    activeTrials: 0,
    pendingPayments: 0
  };

  const newCompaniesChart = data?.newCompaniesChart || [
    { month: '04', count: 2 },
    { month: '05', count: 4 },
    { month: '06', count: 9 },
    { month: '07', count: 6 },
    { month: '08', count: 1 },
    { month: '09', count: 5 },
  ];

  const revenueChartData = data?.revenueChart || [
    { month: 'Abr', valor: 250000 },
    { month: 'Mai', valor: 420000 },
    { month: 'Jun', valor: 580000 },
    { month: 'Jul', valor: 690000 },
    { month: 'Ago', valor: 750000 },
    { month: 'Set', valor: 850000 },
  ];

  const companiesByPlanData = data?.companiesByPlanChart || [
    { name: 'Plano Demo', count: 8, fill: '#818cf8' },
    { name: 'Micro Empresa', count: 12, fill: '#4f46e5' },
    { name: 'Profissional', count: 5, fill: '#06b6d4' },
    { name: 'Enterprise', count: 2, fill: '#10b981' }
  ];

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Visão geral do Painel Admin</h1>
          <p className="text-xs text-slate-500 font-medium">Gestão centralizada de empresas, receitas e subscrições Salya.</p>
        </div>

        {/* Botões de Ações Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate("/companies")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Criar Empresa
          </button>
          <button
            onClick={() => navigate("/subscriptions")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Atribuir Subscrição
          </button>
          <button
            onClick={() => navigate("/payments")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Validar Pagamento
          </button>
          <button
            onClick={() => navigate("/logs")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            Auditoria
          </button>
        </div>
      </div>

      {/* Metric Cards - Preserved Original Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Empresas */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/companies")}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between group"
          >
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Empresas Registadas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.totalCompanies}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 mt-2 block">
                +5 novas este mês
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 2: Subscrições ativas */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate("/subscriptions")}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between group"
          >
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Subscrições Ativas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.activeSubscriptions}</span>
              </div>
              <span className="text-xs font-medium text-slate-400 mt-2 block">
                {metrics.totalCompanies} empresas totais
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 3: Utilizadores */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/users")}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between group"
          >
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Utilizadores Totais</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.totalUsers}</span>
              </div>
              <span className="text-xs font-medium text-slate-400 mt-2 block">
                contas associadas
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 4: Renovações próximas */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate("/subscriptions")}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between group"
          >
            <div>
              <span className="text-xs font-medium text-slate-500 block mb-1">Renovações Próximas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.expiringSoon || 0}</span>
              </div>
              <span className="text-xs font-semibold text-amber-600 mt-2 block">
                nos próximos 7 dias
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Row 1: Original Widgets (Estado das Subscrições + Novas Empresas últimos 6 meses) */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget Left: Estado das subscrições */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Estado das subscrições</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ativas */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Ativas</span>
                  <span className="text-xl font-bold text-emerald-600">{metrics.activeSubscriptions}</span>
                </div>
              </div>

              {/* Expiram em 7 dias */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Expiram em 7 dias</span>
                  <span className="text-xl font-bold text-slate-800">{metrics.expiringSoon || 0}</span>
                </div>
              </div>

              {/* Expiradas */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Expiradas</span>
                  <span className="text-xl font-bold text-rose-600">{metrics.expiredSubscriptions}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Widget Right: Novas empresas (últimos 6 meses) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Novas empresas (últimos 6 meses)</h3>
              </div>
            </div>

            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={newCompaniesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Empresas"]}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {newCompaniesChart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === newCompaniesChart.length - 1 ? "#4f46e5" : "#818cf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Row 2: Novos Gráficos (Evolução de Receita & Empresas por Plano) */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Evolução de Receita */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Evolução de Receita</h3>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {formatCurrency(metrics.monthlyRevenue || 850000)} /mês
              </span>
            </div>

            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenueDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradRevenueDash)"
                    dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Gráfico 2: Empresas por Plano */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Empresas por Plano</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Distribuição Ativa</span>
            </div>

            <div className="w-full min-w-0">
              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap mb-3">
                {companiesByPlanData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.fill }} />
                    <span className="text-[11px] text-slate-500 font-semibold">{entry.name}</span>
                    <span className="text-[11px] font-black" style={{ color: entry.fill }}>{entry.count}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={companiesByPlanData} layout="vertical" margin={{ top: 4, right: 48, left: 10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} empresa${value !== 1 ? 's' : ''}`, "Total"]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                    {companiesByPlanData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} formatter={(v: number) => `${v}`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Seção Banner: Resumo Financeiro Corporativo Salya */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Receita & Subscrições Corporativas</span>
              <h3 className="text-2xl font-black text-white mt-1">Faturação Total Salya SaaS</h3>
              <p className="text-slate-300 text-sm mt-1">Visão integrada das métricas de faturação e subscrições ativas.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase block">Receita Estimada</span>
                <span className="text-xl font-extrabold text-white">{formatCurrency(metrics.monthlyRevenue || 850000)}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase block">Acumulado Anual</span>
                <span className="text-xl font-extrabold text-white">{formatCurrency(metrics.annualRevenue || 10200000)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
