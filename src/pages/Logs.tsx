import { useState, useEffect } from "react";
import { Search, User, Globe, Download } from "lucide-react";
import { formatDate } from "../lib/formatters";
import { apiGet } from "../lib/api";
import { exportCSV, formatDateForCSV } from "../lib/csvExport";
import Swal from "sweetalert2";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Logs de Auditoria | Salya Admin";
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    apiGet("/admin/logs")
      .then(res => res.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    exportCSV({
      filename: 'logs_auditoria_salya',
      reportTitle: 'Relatório de Logs de Auditoria do Sistema',
      headers: ['ID', 'Utilizador', 'Ação', 'Detalhes', 'Data e Hora'],
      rows: logs.map(l => [
        l.id || '',
        l.user || '',
        l.action || '',
        l.details || '',
        formatDateForCSV(l.timestamp)
      ]),
      includeMetadata: true
    });
    Swal.fire({
      icon: "success",
      title: "Exportado!",
      text: "Logs exportados com sucesso",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const filteredLogs = logs.filter(log => {
    const user = log.user ?? "";
    const details = log.details ?? "";
    const action = log.action ?? "";
    
    const matchesSearch = user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "ALL" || action.toUpperCase().includes(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logs de Auditoria</h1>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Exportar CSV
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar em utilizadores ou detalhes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto">
          {['ALL', 'LOGIN', 'COMPANY', 'SUBSCRIPTION', 'USER_MANAGEMENT'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilterAction(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                filterAction === cat 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                  : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500 font-semibold bg-transparent">
                <th className="py-3.5 px-6 font-semibold">Utilizador / Data</th>
                <th className="py-3.5 px-6 font-semibold">Ação</th>
                <th className="py-3.5 px-6 font-semibold">Detalhes</th>
                <th className="py-3.5 px-6 font-semibold text-right">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-transparent">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-100/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-slate-900">{log.user}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-normal">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700 font-medium">
                    {log.details}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-400 text-[11px]">
                    <div className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>192.168.1.1</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Nenhum log de auditoria encontrado.
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
