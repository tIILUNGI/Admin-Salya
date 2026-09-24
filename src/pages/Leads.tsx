import { useState, useEffect, useCallback } from "react";
import { apiGet, apiDelete } from "../lib/api";
import {
  Search, Download, Trash2
} from "lucide-react";
import Swal from "sweetalert2";

interface Lead {
  id: number;
  nome: string;
  email: string;
  consentimento: boolean;
  createdAt: string;
  ultimoAcesso: string;
  totalSimulacoes: number;
}

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
  const [stats, setStats] = useState({ total: 0, registadosHoje: 0, registadosSemana: 0, comConsentimento: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recente" | "antigo" | "nome" | "simulacoes">("recente");

  useEffect(() => {
    document.title = "Leads | Salya Admin";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/admin/leads");
      if (!res.ok) throw new Error("Erro ao carregar leads");
      const data: Lead[] = await res.json();
      setLeads(data || []);
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const semana = new Date(hoje); semana.setDate(semana.getDate() - 7);
      setStats({
        total: data.length,
        registadosHoje: data.filter(l => new Date(l.createdAt) >= hoje).length,
        registadosSemana: data.filter(l => new Date(l.createdAt) >= semana).length,
        comConsentimento: data.filter(l => l.consentimento).length,
      });
    } catch (e) {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => (l.nome || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "recente": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "antigo": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "nome": result.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")); break;
      case "simulacoes": result.sort((a, b) => (b.totalSimulacoes || 0) - (a.totalSimulacoes || 0)); break;
    }
    setFiltered(result);
  }, [leads, search, sortBy]);

  const handleDelete = async (lead: Lead) => {
    const result = await Swal.fire({
      title: "Excluir Lead?",
      text: `Deseja remover o lead ${lead.nome}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await apiDelete(`/admin/leads/${lead.id}`);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      Swal.fire("Removido!", "Lead excluído com sucesso.", "success");
    } catch (e) {
      Swal.fire("Erro", "Não foi possível remover o lead", "error");
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
    const a = document.createElement("a"); a.href = url; a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads Registados</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex items-center gap-8 py-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Leads</span>
          <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Registados Hoje</span>
          <span className="text-2xl font-extrabold text-emerald-600">{stats.registadosHoje}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Autorizados RGPD</span>
          <span className="text-2xl font-extrabold text-indigo-600">{stats.comConsentimento}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-all"
        >
          <option value="recente">Mais recentes</option>
          <option value="antigo">Mais antigos</option>
          <option value="nome">Nome A–Z</option>
          <option value="simulacoes">Mais simulações</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500 font-semibold bg-transparent">
                <th className="py-3.5 px-6 font-semibold">Nome</th>
                <th className="py-3.5 px-6 font-semibold">Email</th>
                <th className="py-3.5 px-6 font-semibold">Registo</th>
                <th className="py-3.5 px-6 font-semibold">Último Acesso</th>
                <th className="py-3.5 px-6 font-semibold text-center">Simulações</th>
                <th className="py-3.5 px-6 font-semibold text-center">RGPD</th>
                <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-transparent">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-100/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {(lead.nome || "L").charAt(0).toUpperCase()}
                      </div>
                      <span>{lead.nome}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono">{lead.email}</td>
                  <td className="py-4 px-6 text-slate-600 font-mono">{fmtDate(lead.createdAt)}</td>
                  <td className="py-4 px-6 text-slate-600 font-mono">{timeSince(lead.ultimoAcesso)}</td>
                  <td className="py-4 px-6 text-center font-bold text-slate-800">{lead.totalSimulacoes || 0}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${
                      lead.consentimento ? "bg-emerald-100/70 text-emerald-800" : "bg-slate-200/70 text-slate-700"
                    }`}>
                      {lead.consentimento ? "Autorizado" : "Não"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(lead)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg transition-all"
                      title="Excluir Lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
