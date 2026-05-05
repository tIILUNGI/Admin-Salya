import { useState, useEffect } from "react";
import { DollarSign, Search, CheckCircle, Clock, MoreVertical, CreditCard, ExternalLink, Check, Download, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "../lib/formatters";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = () => {
    fetch("/api/admin/payments")
      .then(res => res.json())
      .then(setPayments);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirmPayment = async (id: string) => {
    if (!confirm("Confirmar recebimento manual deste pagamento?")) return;
    
    await fetch(`/api/admin/payments/${id}/confirm`, {
      method: "POST",
    });
    fetchPayments();
  };

  const filteredPayments = payments.filter(p => 
    (p.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.subscriptionId ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Controle de Pagamentos</h1>
          <p className="text-slate-500 mt-1">Gestão de transações e conciliação bancária.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 w-full md:w-64 text-sm font-medium transition-all"
            />
          </div>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-all">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID Transação</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Pago</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Data Processada</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="group hover:bg-primary-50/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-sm tracking-tighter uppercase">{pay.id}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Referência: {pay.subscriptionId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-primary-600 font-mono tracking-tight">{formatCurrency(pay.amount)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600 shadow-sm transition-colors">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{pay.method}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {formatDate(pay.date)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      pay.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${pay.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {pay.status === 'completed' ? 'Validado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {pay.status === 'pending' ? (
                        <button 
                          onClick={() => handleConfirmPayment(pay.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                          title="Confirmar Pagamento"
                        >
                          <Check className="w-4.5 h-4.5" />
                        </button>
                      ) : (
                        <button className="bg-white border border-slate-100 text-slate-400 hover:text-primary-600 transition-all p-2.5 rounded-xl shadow-sm">
                          <ExternalLink className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
