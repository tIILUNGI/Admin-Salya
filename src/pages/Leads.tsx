import { useState, useEffect, useCallback } from "react";
import { apiGet, apiDelete } from "../lib/api";
import {
  Search, Mail, User, Calendar, Activity, TrendingUp,
  Download, Trash2, RefreshCw, Users, Flag
} from "lucide-react";

interface Lead {
  id: number;
  nome: string;
  email: string;
  consentimento: boolean;
  createdAt: string;
  ultimoAcesso: string;
  totalSimulacoes: number;
}

interface Stats {
  total: number;
  registadosHoje: number;
  registadosSemana: number;
  comConsentimento: number;
}

const fmt = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-AO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-AO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const timeSince = (dateStr: string) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, registadosHoje: 0, registadosSemana: 0, comConsentimento: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recente" | "antigo" | "nome" | "simulacoes">("recente");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/admin/leads");
      if (!res.ok) throw new Error("Erro ao carregar leads");
      const data: Lead[] = await res.json();
      setLeads(data);
      // Calcular estatísticas
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const semana = new Date(hoje); semana.setDate(semana.getDate() - 7);
      setStats({
        total: data.length,
        registadosHoje: data.filter(l => new Date(l.createdAt) >= hoje).length,
        registadosSemana: data.filter(l => new Date(l.createdAt) >= semana).length,
        comConsentimento: data.filter(l => l.consentimento).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "recente": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "antigo": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "nome": result.sort((a, b) => a.nome.localeCompare(b.nome)); break;
      case "simulacoes": result.sort((a, b) => b.totalSimulacoes - a.totalSimulacoes); break;
    }
    setFiltered(result);
  }, [leads, search, sortBy]);

  const handleDelete = async (lead: Lead) => {
    setDeletingId(lead.id);
    try {
      await apiDelete(`/admin/leads/${lead.id}`);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const exportCSV = () => {
    const header = ["ID", "Nome", "Email", "Consentimento", "Data Registo", "Último Acesso", "Total Simulações"];
    const rows = leads.map(l => [
      l.id, `"${l.nome}"`, l.email, l.consentimento ? "Sim" : "Não",
      fmtDate(l.createdAt), fmtDate(l.ultimoAcesso), l.totalSimulacoes,
    ]);
    const csv = [header, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads_folha_angola_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Total de Leads", value: stats.total, icon: Users, color: "from-indigo-500 to-violet-600", light: "bg-indigo-50 text-indigo-700" },
    { label: "Registados Hoje", value: stats.registadosHoje, icon: TrendingUp, color: "from-emerald-500 to-teal-600", light: "bg-emerald-50 text-emerald-700" },
    { label: "Últimos 7 Dias", value: stats.registadosSemana, icon: Calendar, color: "from-amber-500 to-orange-500", light: "bg-amber-50 text-amber-700" },
    { label: "Com Consentimento", value: stats.comConsentimento, icon: Flag, color: "from-rose-500 to-pink-600", light: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Folha Angola — Leads</h1>
          </div>
          <p className="text-sm text-slate-500">Visitantes registados nos simuladores públicos de 13.º mês e rescisão de contrato.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <button onClick={exportCSV} disabled={leads.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${s.light}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            <option value="recente">Mais recentes</option>
            <option value="antigo">Mais antigos</option>
            <option value="nome">Nome A–Z</option>
            <option value="simulacoes">Mais simulações</option>
          </select>
        </div>
        {search && (
          <p className="text-xs text-slate-400 mt-3 font-medium">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "<strong>{search}</strong>"
          </p>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">A carregar leads...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium text-sm">
              {search ? "Nenhum lead encontrado para esta pesquisa." : "Ainda não há leads registados."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-xs text-indigo-600 font-bold hover:underline">
                Limpar pesquisa
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">#</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Registo</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:table-cell">Último Acesso</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell">Simulações</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">RGPD</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                          {lead.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{lead.nome}</p>
                          <a href={`mailto:${lead.email}`}
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />{lead.email}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {fmtDate(lead.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-300" />
                        <div>
                          <p className="text-xs font-medium text-slate-600">{timeSince(lead.ultimoAcesso)}</p>
                          <p className="text-[10px] text-slate-400">{fmtDate(lead.ultimoAcesso)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${
                        lead.totalSimulacoes > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                      }`}>
                        {lead.totalSimulacoes}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {lead.consentimento
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Autorizado</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">Não</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmDelete(lead)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Remover lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">
              Total: <strong className="text-slate-600">{filtered.length}</strong> lead{filtered.length !== 1 ? "s" : ""}
              {search && ` (filtrado de ${leads.length})`}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Eliminação */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-800 text-lg mb-1">Remover Lead</h3>
              <p className="text-sm text-slate-500">
                Tem a certeza que pretende remover <strong>{confirmDelete.nome}</strong> ({confirmDelete.email})?
                Esta ação é irreversível.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete.id}
                className="flex-1 py-3 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all disabled:opacity-60">
                {deletingId === confirmDelete.id ? "A remover..." : "Confirmar Remoção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
