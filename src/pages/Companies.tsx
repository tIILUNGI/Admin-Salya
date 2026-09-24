import { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, X, Mail, Phone, Calendar, Building2, Trash2, Plus, Users as UsersIcon } from "lucide-react";
import { formatDate } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiDelete } from "../lib/api";

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State para Nova Empresa
  const [newCompany, setNewCompany] = useState({
    nome: "",
    nif: "",
    email: "",
    telefone: "",
    plano: "Micro Empresa",
    employees: 1
  });

  useEffect(() => {
    document.title = "Empresas | Salya Admin";
  }, []);

  const fetchCompanies = () => {
    setIsLoading(true);
    apiGet("/admin/companies")
      .then(res => res.json())
      .then(data => {
        const formattedData = (Array.isArray(data) ? data : []).map(company => ({
          ...company,
          employees: Number(company.employees ?? company.numberOfEmployees ?? company.employeeCount ?? 0)
        }));
        setCompanies(formattedData);
      })
      .catch(() => setCompanies([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
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

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCompany.nome.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiPost("/admin/companies", {
        nome: newCompany.nome,
        demo: newCompany.plano === "Demo",
        status: "active",
        email: newCompany.email || `contact@${newCompany.nome.toLowerCase().replace(/\s/g, '')}.co.ao`,
        telefone: newCompany.telefone,
        nif: newCompany.nif || "54" + Math.floor(10000000 + Math.random() * 90000000),
        employees: Number(newCompany.employees) || 1,
        plan: newCompany.plano
      });
      
      if (res.ok) {
        fetchCompanies();
        setIsCreateModalOpen(false);
        setNewCompany({ nome: "", nif: "", email: "", telefone: "", plano: "Micro Empresa", employees: 1 });
        Swal.fire({
          icon: "success",
          title: "Empresa Criada!",
          text: "A nova empresa foi registada com sucesso",
          confirmButtonColor: "#4f46e5",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error("Erro ao criar empresa");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível criar a empresa",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    
    const result = await Swal.fire({
      title: "Tem a certeza?",
      text: `Deseja realmente ${newStatus === "active" ? "ativar" : "suspender"} esta empresa?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    await apiPost(`/admin/companies/${id}/status`, { status: newStatus });
    fetchCompanies();
    if (selectedCompany?.id === id) {
       setSelectedCompany({ ...selectedCompany, status: newStatus });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "ATENÇÃO!",
      text: `Deseja realmente remover a empresa "${name}"? Esta ação é irreversível.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    await apiDelete(`/admin/companies/${id}`);
    fetchCompanies();
    setSelectedCompany(null);
    
    Swal.fire({
      icon: "success",
      title: "Removida!",
      text: "A empresa foi removida com sucesso",
      confirmButtonColor: "#4f46e5",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const viewDetails = async (id: string) => {
    try {
      const res = await apiGet(`/admin/companies/${id}`);
      const data = await res.json();
      const formattedData = {
        ...data,
        employees: Number(data.employees ?? data.numberOfEmployees ?? data.employeeCount ?? 0)
      };
      setSelectedCompany(formattedData);
    } catch (err) {
      console.error(err);
    }
  };

  // Contadores Resumidos
  const totalCount = companies.length;
  const withAccessCount = companies.filter(c => c.status === "active" || c.hasAccess).length;
  const withoutAccessCount = companies.filter(c => c.status !== "active" && c.status !== "suspended").length;
  const suspendedCount = companies.filter(c => c.status === "suspended").length;

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nif || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesSearch && (c.status === "active" || c.hasAccess);
    if (statusFilter === "NO_ACCESS") return matchesSearch && (c.status !== "active" && c.status !== "suspended");
    if (statusFilter === "SUSPENDED") return matchesSearch && c.status === "suspended";

    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Empresas Registadas</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex flex-wrap items-center gap-8 py-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Empresas</span>
          <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Com acesso</span>
          <span className="text-2xl font-extrabold text-emerald-600">{withAccessCount}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Sem acesso</span>
          <span className="text-2xl font-extrabold text-amber-600">{withoutAccessCount}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Suspensas</span>
          <span className="text-2xl font-extrabold text-rose-600">{suspendedCount}</span>
        </div>
      </div>

      {/* Control Bar: Search Input & Status Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar empresa, NIF ou email..."
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
          <option value="ACTIVE">Com acesso</option>
          <option value="NO_ACCESS">Sem acesso / Expirada</option>
          <option value="SUSPENDED">Suspensas</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500 font-semibold bg-transparent">
                <th className="py-3.5 px-6 font-semibold">Empresa</th>
                <th className="py-3.5 px-6 font-semibold hidden md:table-cell">NIF</th>
                <th className="py-3.5 px-6 font-semibold hidden lg:table-cell">Contacto</th>
                <th className="py-3.5 px-6 font-semibold text-center hidden md:table-cell">Colaboradores</th>
                <th className="py-3.5 px-6 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-6 font-semibold hidden lg:table-cell">Plano / Validade</th>
                <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-transparent">
              {filteredCompanies.map((company) => {
                const isExpired = company.status !== "active" && company.status !== "suspended";
                const isSuspended = company.status === "suspended";
                const companyInitial = (company.name || "E").charAt(0).toUpperCase();

                return (
                  <tr key={company.id} className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 hover:underline cursor-pointer" onClick={() => viewDetails(company.id)}>
                      <div className="flex items-center gap-3">
                        {company.logoUrl || company.logo ? (
                          <img 
                            src={company.logoUrl || company.logo} 
                            alt={company.name} 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-black text-xs shadow-2xs">
                            {companyInitial}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{company.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal font-mono md:hidden">NIF: {company.nif || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-mono hidden md:table-cell">
                      {company.nif || "5401029616"}
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{company.email || "contacto@empresa.co.ao"}</span>
                        </div>
                        {company.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{company.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-800 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-700 font-semibold text-xs">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                        {company.employees || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isSuspended ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-rose-100/70 text-rose-700">Suspensa</span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-100/70 text-amber-800">Expirada</span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-100/70 text-emerald-800">Ativa</span>
                      )}
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div>
                        <span className="font-medium text-slate-800 block">{company.plan || "Enterprise"}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{formatDate(company.validUntil || "2026-09-15")}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(company.id, company.status)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Renovar</span>
                        </button>
                        <button
                          onClick={() => viewDetails(company.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card Modal para Criar Nova Empresa */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Registar Nova Empresa</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: OMNIdata Lda"
                  value={newCompany.nome}
                  onChange={(e) => setNewCompany({ ...newCompany, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NIF</label>
                  <input
                    type="text"
                    placeholder="Ex: 5401029616"
                    value={newCompany.nif}
                    onChange={(e) => setNewCompany({ ...newCompany, nif: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="+244 923 000 000"
                    value={newCompany.telefone}
                    onChange={(e) => setNewCompany({ ...newCompany, telefone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Profissional</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.co.ao"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plano Inicial</label>
                  <select
                    value={newCompany.plano}
                    onChange={(e) => setNewCompany({ ...newCompany, plano: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="Demo">Demo (7 dias)</option>
                    <option value="Micro Empresa">Micro Empresa</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">N.º Estimado de Colaboradores</label>
                <input
                  type="number"
                  min="1"
                  value={newCompany.employees}
                  onChange={(e) => setNewCompany({ ...newCompany, employees: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs mt-2"
              >
                {isLoading ? "A Registar..." : "Registar Empresa"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedCompany(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{selectedCompany.name}</h3>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">NIF</span>
                <span className="font-mono font-semibold text-slate-800">{selectedCompany.nif || "Não informado"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Contacto</span>
                <span className="font-semibold text-slate-800">{selectedCompany.email || selectedCompany.phone || "Não informado"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Plano</span>
                <span className="font-semibold text-slate-800">{selectedCompany.plan || "Enterprise"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Colaboradores</span>
                <span className="font-semibold text-slate-800">{selectedCompany.employees}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleToggleStatus(selectedCompany.id, selectedCompany.status)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all"
              >
                {selectedCompany.status === "active" ? "Suspender Empresa" : "Ativar Acesso"}
              </button>
              <button
                onClick={() => handleDelete(selectedCompany.id, selectedCompany.name)}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}