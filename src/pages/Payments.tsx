import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle2, Clock, CreditCard, ExternalLink, Check, Download, Calendar, TrendingUp, Wallet, Filter } from "lucide-react";
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
    apiGet("/admin/payments/active")
      .then(res => {
        if (!res.ok) throw new Error("Falha ao carregar pagamentos");
        return res.json();
      })
      .then(data => {
        setPayments(data || []);
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

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    if (querySearch !== searchTerm) setSearchTerm(querySearch);
  }, [searchParams, searchTerm]);

  useEffect(() => {
    const currentQuery = searchParams.get("search") || "";
    if (searchTerm !== currentQuery) {
      if (searchTerm.trim()) setSearchParams({ search: searchTerm.trim() });
      else setSearchParams({});
    }
  }, [searchTerm, searchParams, setSearchParams]);

  const handleConfirmPayment = async (reference: string) => {
    const result = await Swal.fire({
      title: "Confirmar Pagamento",
      text: "Deseja validar este pagamento?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#9333ea",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiPost(`/admin/payments/${reference}/confirm`, {});
      if (res.ok) {
        fetchPayments();
        Swal.fire({
          icon: "success",
          title: "Confirmado!",
          text: "Pagamento validado com sucesso",
          confirmButtonColor: "#9333ea",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível confirmar",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleExportPayments = () => {
    const headers = ["ID", "Empresa", "Plano", "Valor", "Método", "Data", "Status", "Referência"];
    const rows = payments.map(p => [
      p.id,
      p.companyName ?? "",
      p.planName ?? "",
      p.amount.toString(),
      p.method,
      p.date,
      p.status,
      p.reference
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    Swal.fire({
      icon: "success",
      title: "Exportado!",
      text: "Histórico exportado com sucesso",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return payments.filter(p =>
      String(p.id ?? "").toLowerCase().includes(term) ||
      String(p.userName ?? "").toLowerCase().includes(term) ||
      String(p.userEmail ?? "").toLowerCase().includes(term) ||
      String(p.companyName ?? "").toLowerCase().includes(term) ||
      String(p.planName ?? "").toLowerCase().includes(term) ||
      String(p.reference ?? "").toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const totalPaid = useMemo(() => payments
    .filter(p => p.status === "CONFIRMADO")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);
  const totalPending = useMemo(() => payments
    .filter(p => p.status === "PENDENTE")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-lg" />)}
        </div>
        <div className="h-96 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <div className="enterprise-card p-12 text-center">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button onClick={fetchPayments} className="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Histórico de Pagamentos</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Registo financeiro de subscrições activas com plano pago</p>
        </div>
        <button
          onClick={handleExportPayments}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-700 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="enterprise-card p-5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Total Pago</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(totalPaid)}</p>
          <p className="text-emerald-600 text-[10px] font-bold mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> {payments.filter(p => p.status === "CONFIRMADO").length} validados
          </p>
        </div>
        <div className="enterprise-card p-5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Total Pendente</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(totalPending)}</p>
          <p className="text-amber-600 text-[10px] font-bold mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {payments.filter(p => p.status === "PENDENTE").length} pendentes
          </p>
        </div>
        <div className="enterprise-card p-5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Registos</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{payments.length}</p>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Transacções</p>
        </div>
        <div className="enterprise-card p-5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Período</p>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {payments.length > 0 ? formatDate(payments[payments.length - 1]?.date).split(" ")[0] : "—"}
          </p>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Último registo</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, plano, referência..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500 w-full text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Plano</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Ref.</th>
                <th className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-50 rounded-xl mb-4">
                      <CreditCard className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-semibold text-sm">Nenhum pagamento encontrado</p>
                    <p className="text-slate-300 text-xs mt-1">Os pagamentos aparecem após confirmação das subscrições pagas</p>
                  </td>
                </tr>
              )}
              {filteredPayments.map(pay => {
                const isConfirmed = pay.status === "CONFIRMADO";
                const isPending = pay.status === "PENDENTE";
                return (
                  <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight">#{pay.id}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{pay.planName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{pay.companyName || pay.userName || "—"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{pay.userEmail || "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-[10px] font-extrabold uppercase tracking-wider border border-primary-100">
                        {pay.planName || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">{formatCurrency(pay.amount)}</span>
                    </td>
                    <td className="px-5 py-4 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {formatDate(pay.date)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Check className="w-3 h-3" /> Validado
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                          <div className="w-1 h-1 rounded-full bg-amber-500" /> Pendente
                        </span>
                      )}
                      {!isConfirmed && !isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                          {pay.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {pay.reference || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleConfirmPayment(pay.reference)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-500/20 transition-all"
                            title="Validar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewPaymentDetails(pay)}
                          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 rounded-lg shadow-sm transition-all"
                          title="Ver detalhes"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {payments.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {filteredPayments.length} de {payments.length} registos
            </p>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Apenas planos pagos e activos
            </p>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {showDetails && selectedPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Detalhes do Pagamento</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-0.5">#{selectedPayment.id}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-slate-400 rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Valor</p>
                        <p className="text-xl font-extrabold text-primary-600 tracking-tight">{formatCurrency(selectedPayment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Método</p>
                        <p className="text-base font-extrabold text-slate-900">{selectedPayment.method}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Data</p>
                        <p className="text-sm font-extrabold text-slate-700">{formatDate(selectedPayment.date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Estado</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                          selectedPayment.status === 'CONFIRMADO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {selectedPayment.status === 'CONFIRMADO' ? 'Validado' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Empresa</p>
                        <p className="text-sm font-extrabold text-slate-900">{selectedPayment.companyName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Plano</p>
                        <p className="text-sm font-extrabold text-slate-900">{selectedPayment.planName || "—"}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Referência</p>
                      <p className="font-mono text-sm text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 tracking-tight">
                        {selectedPayment.reference || "N/A"}
                      </p>
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
