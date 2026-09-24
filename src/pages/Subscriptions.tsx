import { useState, useEffect, useMemo } from "react";
import { Calendar, Plus, Search, Download, X, ChevronDown, ChevronUp, RefreshCw, Zap, Building2, User, Mail, Users as UsersIcon, ShieldAlert } from "lucide-react";
import { formatDate, formatCurrency } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut } from "../lib/api";

const getPlanLabel = (planId: string, customName?: string) => {
  if (customName && customName.trim()) return customName;
  if (planId === "p0" || planId === "DEMO") return "Plano Demo";
  if (planId === "p1" || planId === "SEMESTRAL") return "Micro Empresa";
  if (planId === "p2" || planId === "ANUAL") return "Profissional";
  if (planId === "p3" || planId === "CORPORATIVO" || planId === "Enterprise") return "Enterprise";
  return planId || "Enterprise";
};

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modals & Active Selections
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [newPlanId, setNewPlanId] = useState("p2");
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Subscrições | Salya Admin";
  }, []);

  const fetchSubscriptions = () => {
    setIsLoading(true);
    apiGet("/admin/subscriptions")
      .then(res => res.json())
      .then(data => setSubs(Array.isArray(data) ? data : []))
      .catch(() => setSubs([]))
      .finally(() => setIsLoading(false));
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
  }, []);

  const toggleExpandCompany = (companyKey: string) => {
    setExpandedCompanies(prev => ({ ...prev, [companyKey]: !prev[companyKey] }));
  };

  const handleRenew = (sub: any) => {
    setSelectedSub(sub);
    setShowRenewModal(true);
  };

  const handleChangePlan = (sub: any) => {
    setSelectedSub(sub);
    setNewPlanId(sub.planId || "p2");
    setShowChangePlanModal(true);
  };

  const confirmRenewal = async () => {
    if (!selectedSub) return;
    setIsLoading(true);
    try {
      const res = await apiPost(`/admin/subscriptions/${selectedSub.id}/renew`, {});
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Subscrição Renovada!", text: "A subscrição foi renovada com sucesso", confirmButtonColor: "#4f46e5", timer: 1500, showConfirmButton: false });
        setShowRenewModal(false);
        fetchSubscriptions();
      } else throw new Error("Failed");
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível renovar a subscrição", confirmButtonColor: "#ef4444" });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmChangePlan = async () => {
    if (!selectedSub) return;
    setIsLoading(true);
    try {
      const res = await apiPut(`/admin/subscriptions/${selectedSub.id}/plan`, { planId: newPlanId });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Plano Alterado!", text: "O plano da subscrição foi atualizado com sucesso", confirmButtonColor: "#4f46e5", timer: 1500, showConfirmButton: false });
        setShowChangePlanModal(false);
        fetchSubscriptions();
      } else {
        throw new Error("Failed");
      }
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível alterar o plano", confirmButtonColor: "#ef4444" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (subs.length === 0) {
      Swal.fire({ icon: "info", title: "Aviso", text: "Não há dados para exportar." });
      return;
    }
    const headers = ["ID", "Empresa", "Plano", "Início", "Fim", "Estado"];
    const rows = subs.map(s => [
      s.id,
      `"${s.companyName || companies[String(s.companyId)]?.name || 'Empresa'}"`,
      `"${getPlanLabel(s.planId, s.planName)}"`,
      s.startDate || "2026-09-14",
      s.endDate || "2026-09-15",
      s.status || "active"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscricoes_salya_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group Subscriptions by Company
  const groupedCompanies = useMemo(() => {
    const groups: Record<string, { companyName: string; companyData: any; subscriptions: any[] }> = {};

    subs.forEach(sub => {
      const companyData = companies[String(sub.companyId)] || {};
      const key = String(sub.companyId || sub.companyName || "default");
      const cName = sub.companyName || companyData.name || "Empresa Sem Nome";

      if (!groups[key]) {
        groups[key] = {
          companyName: cName,
          companyData: companyData,
          subscriptions: []
        };
      }
      groups[key].subscriptions.push(sub);
    });

    // Convert to Array & Filter
    return Object.entries(groups).filter(([_, group]) => {
      const cName = group.companyName.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || cName.includes(term) || group.subscriptions.some(s => getPlanLabel(s.planId, s.planName).toLowerCase().includes(term));

      const hasActive = group.subscriptions.some(s => s.status === "active" || s.status === "ATIVA");
      if (statusFilter === "ACTIVE") return matchesSearch && hasActive;
      if (statusFilter === "EXPIRED") return matchesSearch && !hasActive;

      return matchesSearch;
    });
  }, [subs, companies, searchTerm, statusFilter]);

  // Contadores Globais
  const totalCount = subs.length;
  const activeCount = subs.filter(s => s.status === "active" || s.status === "ATIVA").length;
  const expiredCount = subs.filter(s => s.status !== "active" && s.status !== "ATIVA").length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscrições por Empresa</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            EXPORTAR CSV
          </button>
          <button
            onClick={() => {
              if (subs.length > 0) handleRenew(subs[0]);
              else Swal.fire({ icon: "info", title: "Info", text: "Nenhuma subscrição disponível para renovar." });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Atribuir ou renovar
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex items-center gap-8 py-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Subscrições</span>
          <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Com Acesso Ativo</span>
          <span className="text-2xl font-extrabold text-emerald-600">{activeCount}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Sem Acesso / Expiradas</span>
          <span className="text-2xl font-extrabold text-amber-600">{expiredCount}</span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por empresa, NIF ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-all"
        >
          <option value="ALL">Todos os estados</option>
          <option value="ACTIVE">Ativas</option>
          <option value="EXPIRED">Expiradas</option>
        </select>
      </div>

      {/* Grouped Company Cards List (matching screenshot structure) */}
      <div className="space-y-4">
        {groupedCompanies.map(([key, group]) => {
          const { companyName, companyData, subscriptions } = group;
          const isExpanded = expandedCompanies[key] ?? false; // Default recolhido/collapsed

          const activeSub = subscriptions.find(s => s.status === "active" || s.status === "ATIVA") || subscriptions[0];
          const activeCountCompany = subscriptions.filter(s => s.status === "active" || s.status === "ATIVA").length;
          const historyCount = subscriptions.length;
          const ownerName = companyData?.ownerName || companyData?.gestor || companyName;
          const ownerEmail = companyData?.email || activeSub?.email || "contacto@empresa.co.ao";
          const employees = Number(companyData?.employees ?? companyData?.numberOfEmployees ?? 0);
          const currentPlan = getPlanLabel(activeSub?.planId, activeSub?.planName);

          return (
            <div 
              key={key}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all"
            >
              {/* Header Bar of Company Card */}
              <div 
                onClick={() => toggleExpandCompany(key)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Company Logo or Stylized Initial Badge */}
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
                    {companyData?.logoUrl ? (
                      <img src={companyData.logoUrl} alt={companyName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      companyName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight mb-1">
                      {companyName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        PROPRIETÁRIO: <strong className="text-slate-700 font-semibold">{ownerName}</strong>
                      </span>

                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          <UsersIcon className="w-3 h-3 text-slate-400" />
                          {employees} COLABORADORES
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          🟢 {activeCountCompany} ATIVA
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold text-[10px]">
                          {historyCount} HISTÓRICO
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px] uppercase tracking-wide">
                    {currentPlan}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Card Details & Subscription History */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30 space-y-6">
                  {/* Details Sub-sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Detalhes da Empresa */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-2xs space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                        DETALHES DA EMPRESA
                      </span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Nome Comercial:</span>
                        <span className="font-bold text-slate-900">{companyName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">NIF:</span>
                        <span className="font-mono text-slate-700">{companyData?.nif || "5401029616"}</span>
                      </div>
                    </div>

                    {/* Dados do Proprietário */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-2xs space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                        DADOS DO PROPRIETÁRIO
                      </span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Nome do Gestor:</span>
                        <span className="font-bold text-slate-900">{ownerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Email:</span>
                        <span className="font-mono text-slate-700">{ownerEmail}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Colaboradores:</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{employees}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscrições / Histórico Items */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      HISTÓRICO DE SUBSCRIÇÕES
                    </span>

                    {subscriptions.map((sub, idx) => {
                      const isActive = sub.status === "active" || sub.status === "ATIVA";
                      const planLabel = getPlanLabel(sub.planId, sub.planName);

                      return (
                        <div 
                          key={sub.id}
                          className="bg-white rounded-xl p-4 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-indigo-200 transition-all"
                        >
                          {/* Left: ID, Plan Name & Badges */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4 fill-amber-400" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{planLabel}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                                {sub.billingCycle || "MENSAL"}
                              </span>
                              {idx === 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[10px] uppercase">
                                  RECENTE
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                                TRIAL {sub.durationDays || 30} DIAS
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                ID: {sub.id}
                              </span>
                            </div>
                          </div>

                          {/* Right: Dates, Status & Actions */}
                          <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
                            <div className="text-right text-[11px] font-mono">
                              <span className="text-slate-400 block">CRIADA: <strong className="text-slate-700 font-semibold">{formatDate(sub.startDate || sub.createdAt || "2026-09-14")}</strong></span>
                              <span className="text-slate-400 block">VALIDADE: <strong className="text-slate-700 font-semibold">{formatDate(sub.endDate || "2026-09-15")}</strong></span>
                            </div>

                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold ${
                              isActive ? "bg-emerald-100/80 text-emerald-800" : "bg-rose-100/80 text-rose-800"
                            }`}>
                              {isActive ? "ATIVA" : "EXPIRADA"}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRenew(sub)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                RENOVAR
                              </button>
                              <button
                                onClick={() => handleChangePlan(sub)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                              >
                                ⚙️ MUDAR
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groupedCompanies.length === 0 && (
          <div className="py-16 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-slate-200/80">
            Nenhuma empresa ou subscrição encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal de Renovação */}
      {showRenewModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowRenewModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Renovar Subscrição</h3>
              <button onClick={() => setShowRenewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja renovar a subscrição <strong className="text-slate-900">{getPlanLabel(selectedSub.planId, selectedSub.planName)}</strong> por mais 1 ano/mês?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">
                Cancelar
              </button>
              <button onClick={confirmRenewal} disabled={isLoading} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs">
                {isLoading ? "Renovando..." : "Confirmar Renovação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mudar / Alterar Plano */}
      {showChangePlanModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowChangePlanModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Mudar Plano da Subscrição</h3>
              <button onClick={() => setShowChangePlanModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">Selecione o Novo Plano</label>
                <select
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:bg-white focus:border-indigo-500 font-semibold cursor-pointer text-slate-800"
                >
                  <option value="p0">Plano Demo (30 dias)</option>
                  <option value="p1">Micro Empresa</option>
                  <option value="p2">Profissional</option>
                  <option value="p3">Enterprise / Corporativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowChangePlanModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">
                Cancelar
              </button>
              <button onClick={confirmChangePlan} disabled={isLoading} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs">
                {isLoading ? "A Alterar..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}