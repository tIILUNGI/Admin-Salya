import { useState, useEffect } from "react";
import { Search, Filter, Clock, User, Globe, AlertTriangle, Monitor, Shield, Download } from "lucide-react";
import { formatDate } from "../lib/formatters";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/logs")
      .then(res => res.json())
      .then(setLogs);
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
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Logs de Auditoria</h1>
          <p className="text-slate-500 mt-1">Registo histórico de todas as acções críticas no sistema.</p>
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

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
         {['ALL', 'LOGIN', 'COMPANY', 'SUBSCRIPTION', 'USER_MANAGEMENT'].map(cat => (
           <button 
             key={cat}
             onClick={() => setFilterAction(cat)}
             className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
               filterAction === cat ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-200'
             }`}
           >
             {cat === 'ALL' ? 'Todos os Registos' : cat.replace('_', ' ')}
           </button>
         ))}
      </div>

      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-[0.2em]">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400">Tempo / Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400">Acção Realizada</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400">Detalhes do Evento</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 text-right">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{log.user}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic italic-none">{formatDate(log.timestamp)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">{log.details}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 text-slate-300">
                       <div title="IP Origin" className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                         <Globe className="w-3 h-3" />
                         <span className="text-[10px] font-bold font-mono tracking-tighter">192.168.1.1</span>
                       </div>
                       <Monitor className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-20 text-center">
               <div className="inline-flex p-6 bg-slate-50 rounded-[2rem] text-slate-300 mb-4">
                  <AlertTriangle className="w-12 h-12" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Nenhum log encontrado</h3>
               <p className="text-slate-500 text-sm mt-1">Tente ajustar os seus filtros de busca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
