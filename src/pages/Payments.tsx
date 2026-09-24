import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle2, Clock, CreditCard, Download, Check, X, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pagamentos | Salya Admin";
  }, []);

  const fetchPayments = () => {
    setIsLoading(true);
    setError(null);
    Promise.allSettled([
      apiGet("/admin/payments/active").then(r => r.ok ? r.json() : []),
      apiGet("/admin/companies").then(r => r.ok ? r.json() : [])
    ]).then(([paymentsRes, companiesRes]) => {
      const rawPayments = paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value) ? paymentsRes.value : [];
      const companiesList = companiesRes.status === "fulfilled" && Array.isArray(companiesRes.value) ? companiesRes.value : [];

      const companiesMap: Record<string, any> = {};
      companiesList.forEach((c: any) => {
        if (c.id !== undefined && c.id !== null) companiesMap[String(c.id)] = c;
        if (c.userId) companiesMap[`user_${String(c.userId)}`] = c;
        if (c.email) companiesMap[`email_${String(c.email).toLowerCase()}`] = c;
      });

      const enriched = rawPayments.map((p: any) => {
        let compName = p.companyName || p.company?.name || null;
        if (!compName && p.companyId) {
          compName = companiesMap[String(p.companyId)]?.name;
        }
        if (!compName && p.userId) {
          compName = companiesMap[`user_${String(p.userId)}`]?.name;
        }
        if (!compName && p.userEmail) {
          compName = companiesMap[`email_${String(p.userEmail).toLowerCase()}`]?.name;
        }
        return {
          ...p,
          companyName: compName || p.companyName || p.userName || "Cliente Salya"
        };
      });

      setPayments(enriched);
      setIsLoading(false);
    }).catch(err => {
      setError(err.message);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    if (querySearch !== searchTerm && querySearch !== searchTerm.trim()) {
      setSearchTerm(querySearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const currentQuery = searchParams.get("search") || "";
    const trimmed = searchTerm.trim();
    if (trimmed !== currentQuery) {
      if (trimmed) {
        setSearchParams({ search: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchTerm]);

  const handleConfirmPayment = async (reference: string) => {
    const result = await Swal.fire({
      title: "Confirmar Pagamento",
      text: "Deseja validar este pagamento?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
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
          confirmButtonColor: "#4f46e5",
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamentos</h1>
        <button
          onClick={handleExportPayments}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Exportar CSV
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex items-center gap-8 py-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Confirmado</span>
          <span className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalPaid)}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Pendente</span>
          <span className="text-2xl font-extrabold text-amber-600">{formatCurrency(totalPending)}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Transações</span>
          <span className="text-2xl font-extrabold text-slate-900">{payments.length}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar empresa, plano, referência..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500 font-semibold bg-transparent">
                <th className="py-3.5 px-6 font-semibold">ID</th>
                <th className="py-3.5 px-6 font-semibold">Empresa / Cliente</th>
                <th className="py-3.5 px-6 font-semibold">Plano</th>
                <th className="py-3.5 px-6 font-semibold text-right">Valor</th>
                <th className="py-3.5 px-6 font-semibold text-center">Data</th>
                <th className="py-3.5 px-6 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-6 font-semibold text-center">Ref.</th>
                <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-transparent">
              {filteredPayments.map(pay => {
                const isConfirmed = pay.status === "CONFIRMADO";
                const isPending = pay.status === "PENDENTE";
                return (
                  <tr key={pay.id} className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">#{pay.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div>
                        <p className="text-slate-900">{pay.companyName || pay.userName || "—"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{pay.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-800 font-medium">{pay.planName || "—"}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-600 font-mono">
                      {formatDate(pay.date)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${
                        isConfirmed ? "bg-emerald-100/70 text-emerald-800" : isPending ? "bg-amber-100/70 text-amber-800" : "bg-slate-200/70 text-slate-700"
                      }`}>
                        {isConfirmed ? "Validado" : isPending ? "Pendente" : pay.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-[11px] text-slate-500">
                      {pay.reference || "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleConfirmPayment(pay.reference)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Validar
                          </button>
                        )}
                        <button
                          onClick={() => handleViewPaymentDetails(pay)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Nenhum pagamento encontrado com os critérios fornecidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowDetails(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Detalhes do Pagamento</h3>
              <button onClick={() => setShowDetails(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Valor</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Método</span>
                  <span className="font-semibold text-slate-800">{selectedPayment.method}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Empresa</span>
                  <span className="font-semibold text-slate-900">{selectedPayment.companyName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Plano</span>
                  <span className="font-semibold text-slate-800">{selectedPayment.planName || "—"}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Referência</span>
                <span className="font-mono text-slate-800">{selectedPayment.reference || "N/A"}</span>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
