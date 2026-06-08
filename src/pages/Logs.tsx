import { useState, useEffect } from "react";
import { Search, Filter, Clock, User, Globe, AlertTriangle, Monitor, Shield, Download } from "lucide-react";
import { formatDate } from "../lib/formatters";
import { apiGet } from "../lib/api";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    document.title = "Logs | Salya Admin";
  }, []);

  useEffect(() => {
    apiGet("/admin/logs")
      .then(res => res.json())
      .then(setLogs)
      .catch(() => setLogs([]));
  }, []);

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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Logs de Auditoria</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Registo histórico de acções críticas no sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar em logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 w-full md:w-64 text-sm font-medium transition-all"
            />
          </div>
          <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4">
         {['ALL', 'LOGIN', 'COMPANY', 'SUBSCRIPTION', 'USER_MANAGEMENT'].map(cat => (
           <button 
             key={cat}
             onClick={() => setFilterAction(cat)}
             className={`px-5 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap border ${
               filterAction === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
             }`}
           >
             {cat === 'ALL' ? 'Todos' : cat.replace('_', ' ')}
           </button>
         ))}
       </div>

      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tempo / Usuário</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Acção</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Detalhes</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                          <User className="w-4 h-4" />
                       </div>
                       <div>
                        <p className="font-extrabold text-slate-900 text-sm">{log.user}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{formatDate(log.timestamp)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">{log.details}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                        <Globe className="w-3 h-3" />
                        <span className="text-[10px] font-mono font-bold tracking-tight">192.168.1.1</span>
                       </div>
                       <Monitor className="w-3.5 h-3.5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-16 text-center">
               <div className="inline-flex p-4 bg-slate-50 rounded-xl text-slate-300 mb-4">
                  <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Nenhum log encontrado</h3>
               <p className="text-slate-400 text-xs mt-1.5 font-medium">Ajuste os filtros de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
