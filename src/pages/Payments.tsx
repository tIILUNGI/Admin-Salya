import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DollarSign, Search, CheckCircle, Clock, CreditCard, ExternalLink, Check, Download, Filter, FileText, Printer, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, formatDate } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pagamentos | Salya Admin";
  }, []);

  const fetchPayments = () => {
    setIsLoading(true);
    setError(null);
    apiGet("/admin/payments")
      .then(res => {
        if (!res.ok) throw new Error("Falha ao carregar pagamentos");
        return res.json();
      })
      .then(data => {
        setPayments(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Sincronizar search term com query param (evita loop)
  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    if (querySearch !== searchTerm) {
      setSearchTerm(querySearch);
    }
  }, [searchParams, searchTerm]);

  // Atualizar query param quando search term mudar (evita loop)
  useEffect(() => {
    const currentQuery = searchParams.get("search") || "";
    if (searchTerm !== currentQuery) {
      if (searchTerm.trim()) {
        setSearchParams({ search: searchTerm.trim() });
      } else {
        setSearchParams({});
      }
    }
  }, [searchTerm, searchParams, setSearchParams]);

  const handleConfirmPayment = async (id: string) => {
    const result = await Swal.fire({
      title: "Confirmar Pagamento",
      text: "Tem a certeza que deseja confirmar este pagamento?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/payments/${id}/confirm`, {});

      if (res.ok) {
        fetchPayments();
        Swal.fire({
          icon: "success",
          title: "Confirmado!",
          text: "Pagamento confirmado com sucesso",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível confirmar o pagamento",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleExportPayments = () => {
    const headers = ["ID", "Valor", "Método", "Data", "Status", "Referência"];
    const rows = payments.map(p => [
      p.id,
      p.amount.toString(),
      p.method,
      p.date,
      p.status,
      p.subscriptionId
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "Exportado!",
      text: "Os pagamentos foram exportados com sucesso",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const filteredPayments = payments.filter(p => 
    String(p.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.userName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.userEmail ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.subscriptionId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.reference ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 pb-12">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">Controle de Pagamentos</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Gestão de transações e conciliação bancária.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 w-full sm:w-64 text-sm font-medium transition-all"
              />
            </div>
            <button
              onClick={handleExportPayments}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-6 py-3 rounded-2xl text-[10px] md:text-xs uppercase font-black tracking-[0.2em] shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center hidden md:table-cell">Data</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(pay => (
                  <tr key={pay.id} className="group hover:bg-primary-50/20 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm md:text-base tracking-tighter uppercase">{pay.userName || 'Usuário'}</span>
                        <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">{pay.userEmail}</span>
                        <span className="text-[8px] md:text-[10px] text-primary-500 font-black uppercase tracking-widest mt-1">Plano: {pay.planName}</span>
                        <span className="text-[8px] md:text-[10px] text-slate-300 font-medium">ID: {pay.id}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="text-sm md:text-base font-black text-primary-600 font-mono tracking-tight">{formatCurrency(pay.amount)}</span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600 shadow-sm transition-colors">
                          <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest hidden sm:inline">{pay.method}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      {formatDate(pay.date)}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                        pay.status === 'CONFIRMADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${pay.status === 'CONFIRMADO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {pay.status === 'CONFIRMADO' ? 'Validado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        {pay.status === 'PENDENTE' ? (
                          <button
                            onClick={() => handleConfirmPayment(pay.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                            title="Confirmar Pagamento"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewPaymentDetails(pay)}
                            className="bg-white border border-slate-100 text-slate-400 hover:text-primary-600 transition-all p-2 rounded-xl shadow-sm hover:shadow-md"
                            title="Ver detalhes"
                          >
                            <ExternalLink className="w-4 h-4" />
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

        {/* Empty State */}
        {filteredPayments.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CreditCard className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-bold">Nenhum pagamento encontrado</p>
            <p className="text-sm">Tente ajustar o filtro de busca</p>
          </div>
        )}

        {/* Payment Details Modal */}
        <AnimatePresence>
          {showDetails && selectedPayment && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetails(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6 md:w-7 md:h-7 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-slate-900">Recibo de Pagamento</h3>
                          <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider mt-0.5">{selectedPayment.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Valor</p>
                          <p className="text-xl md:text-2xl font-black text-primary-600">{formatCurrency(selectedPayment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Método</p>
                          <p className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                            {selectedPayment.method}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Data</p>
                          <p className="text-sm font-bold text-slate-700">{formatDate(selectedPayment.date)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Estado</p>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                            selectedPayment.status === 'CONFIRMADO'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {selectedPayment.status === 'CONFIRMADO' ? 'Validado' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referência da Subscrição</p>
                        <p className="font-mono text-sm text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100 break-all">
                          {selectedPayment.subscriptionId}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 mt-4">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all"
                      >
                        <Printer className="w-4 h-4" /> Imprimir
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center max-w-md">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-rose-900 mb-2">Erro ao carregar</h3>
            <p className="text-rose-700 mb-6">{error}</p>
            <button
              onClick={fetchPayments}
              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button
            onClick={handleExportPayments}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID Transação</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Pago</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Data</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-none">
              {filteredPayments.map(pay => (
                <tr key={pay.id} className="group hover:bg-primary-50/20 transition-colors">
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-sm tracking-tighter uppercase">{pay.userName || 'Usuário'}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{pay.userEmail}</span>
                      <span className="text-[10px] text-slate-300 font-medium">ID: {pay.id}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <span className="text-sm font-black text-primary-600 font-mono tracking-tight">{formatCurrency(pay.amount)}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600 shadow-sm transition-colors">
                        <CreditCard className="w-4 md:w-5 h-4 md:h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{pay.method}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {formatDate(pay.date)}
                   </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                     <span className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                       pay.status === 'CONFIRMADO'
                         ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                         : 'bg-amber-50 text-amber-700 border-amber-100'
                     }`}>
                       <div className={`w-1 h-1 rounded-full ${pay.status === 'CONFIRMADO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                       {pay.status === 'CONFIRMADO' ? 'Validado' : 'Pendente'}
                     </span>
                   </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {pay.status === 'PENDENTE' ? (
                        <button
                          onClick={() => handleConfirmPayment(pay.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 md:p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                          title="Confirmar Pagamento"
                        >
                          <Check className="w-4 md:w-4.5 h-4 md:h-4.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleViewPaymentDetails(pay)}
                          className="bg-white border border-slate-100 text-slate-400 hover:text-primary-600 transition-all p-2 md:p-2.5 rounded-xl shadow-sm hover:shadow-md"
                          title="Ver detalhes"
                        >
                          <ExternalLink className="w-4 md:w-4.5 h-4 md:h-4.5" />
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

      {/* Payment Details Modal */}
      <AnimatePresence>
        {showDetails && selectedPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Recibo de Pagamento</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">{selectedPayment.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor</p>
                        <p className="text-2xl font-black text-primary-600">{formatCurrency(selectedPayment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Método</p>
                        <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-slate-400" />
                          {selectedPayment.method}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</p>
                        <p className="text-sm font-bold text-slate-700">{formatDate(selectedPayment.date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          selectedPayment.status === 'CONFIRMADO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {selectedPayment.status === 'CONFIRMADO' ? 'Validado' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referência da Subscrição</p>
                      <p className="font-mono text-sm text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedPayment.subscriptionId}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          // Simular impressão
                          window.print();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                      >
                        <Printer className="w-4 h-4" /> Imprimir
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="flex-1 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
