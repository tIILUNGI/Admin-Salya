import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Search, Filter, Eye, Ban, CheckCircle2, AlertCircle, Trash2, X, Users, Mail, Phone, MapPin, Hash } from "lucide-react";
import { formatDate } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = "Empresas | Salya Admin";
  }, []);

  const fetchCompanies = () => {
    apiGet("/admin/companies")
      .then(res => res.json())
      .then(data => {
        // Garantir que o número de colaboradores é um número
        const formattedData = (Array.isArray(data) ? data : []).map(company => ({
          ...company,
          employees: Number(company.employees ?? company.numberOfEmployees ?? company.employeeCount ?? 0)
        }));
        setCompanies(formattedData);
      })
      .catch(() => setCompanies([]));
  };

  useEffect(() => {
    fetchCompanies();
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

  const handleCreate = async () => {
    const name = prompt("Nome da empresa:");
    if (!name) return;
    
    try {
      const res = await apiPost("/admin/companies", {
        nome: name,
        demo: true,
        status: "active",
        email: "contact@" + name.toLowerCase().replace(/\s/g, '') + ".com",
        telefone: "",
        nif: "NIF-" + Math.floor(Math.random() * 1000000000),
        endereco: "",
        employees: 0
      });
      
      if (res.ok) {
        const newCompany = await res.json();
        setCompanies([...companies, { ...newCompany, employees: Number(newCompany.employees ?? 0) }]);
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Empresa criada com sucesso",
          confirmButtonColor: "#9333ea"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível criar a empresa",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    
    const result = await Swal.fire({
      title: "Tem a certeza?",
      text: `Deseja realmente ${newStatus === "active" ? "ativar" : "suspender"} esta empresa?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#9333ea",
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
      confirmButtonColor: "#9333ea"
    });
  };

  const viewDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiGet(`/admin/companies/${id}`);
      const data = await res.json();
      // Garantir que os colaboradores são um número
      const formattedData = {
        ...data,
        employees: Number(data.employees ?? data.numberOfEmployees ?? data.employeeCount ?? 0)
      };
      setSelectedCompany(formattedData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = (companies || []).filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nif || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Empresas</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Controle de cadastros, status e informações das empresas parceiras.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Empresa
        </button>
       </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, NIF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500 w-full text-sm font-medium transition-all"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors hover:border-primary-200" title="Filtrar Resultados">
            <Filter className="w-5 h-5" />
          </button>
        </div>

      <div className="enterprise-card overflow-hidden shadow-xl border-slate-200/60 transition-all hover:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 md:px-10 py-5 md:py-7 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-6 md:px-10 py-5 md:py-7 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 md:px-10 py-5 md:py-7 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                <th className="px-6 md:px-10 py-5 md:py-7 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 md:px-10 py-5 md:py-7">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white border border-slate-100 rounded-xl md:rounded-3xl flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-105 group-hover:border-primary-100 transition-all duration-300">
                        <span className="text-xl md:text-2xl">{(company.name || "E").charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-base md:text-lg">{company.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                           Desde {formatDate(company.createdAt)}
                        </p>
                        {company.nif && (
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            NIF: {company.nif}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-5 md:py-7">
                    <span className={`px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest border shadow-sm transition-all ${
                      company.trial ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                    }`}>
                      {company.plan || 'Básico'} {company.trial && '• TRIAL'}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-5 md:py-7 text-center">
                    <div className="flex items-center justify-center gap-2.5 text-slate-700 font-extrabold text-base md:text-lg">
                       <Users className="w-5 h-5 text-slate-400" />
                       {Number(company.employees ?? company.numberOfEmployees ?? company.employeeCount ?? 0)}
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-100 transition-all duration-300 transform translate-x-0">
                      <button
                        onClick={() => viewDetails(company.id)}
                        className="p-3 md:p-3.5 bg-white border border-slate-200 hover:bg-primary-50 hover:border-primary-200 text-primary-600 rounded-2xl shadow-sm transition-all hover:scale-110 active:scale-95"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(company.id, company.status)}
                        className={`p-3 md:p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:scale-110 active:scale-95 ${
                          company.status === 'active' ? 'hover:bg-amber-50 hover:border-amber-200 text-amber-600' : 'hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600'
                        }`}
                        title={company.status === 'active' ? "Suspender" : "Ativar"}
                      >
                        {company.status === 'active' ? <Ban className="w-5 h-5 md:w-6 md:h-6" /> : <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="p-3 md:p-3.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-2xl shadow-sm transition-all hover:scale-110 active:scale-95"
                        title="Remover"
                      >
                        <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-medium">Nenhuma empresa encontrada</p>
                      <button
                        onClick={handleCreate}
                        className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-bold"
                      >
                        Criar primeira empresa
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
           </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              onClick={() => setSelectedCompany(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div 
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 border border-white/20 animate-in zoom-in-95 duration-200"
            >
              <button 
                onClick={() => setSelectedCompany(null)}
                className="absolute top-8 right-8 p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                title="Fechar"
              >
                <X className="w-7 h-7" />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 text-4xl font-black shadow-inner">
                  {(selectedCompany.name || "E").charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{selectedCompany.name}</h3>
                  <div className="mt-5 flex flex-wrap gap-4">
                    <StatusBadge status={selectedCompany.status} />
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-black rounded-xl uppercase tracking-widest border border-slate-200 shadow-sm">
                      Plano {selectedCompany.plan || 'Básico'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                <InfoItem icon={Mail} label="Email de Contacto" value={selectedCompany.email} />
                <InfoItem icon={Phone} label="Telefone" value={selectedCompany.phone} />
                <InfoItem icon={Hash} label="NIF" value={selectedCompany.nif} />
                <InfoItem icon={Users} label="Total Colaboradores" value={Number(selectedCompany.employees ?? selectedCompany.numberOfEmployees ?? selectedCompany.employeeCount ?? 0)} />
                <div className="md:col-span-2">
                  <InfoItem icon={MapPin} label="Endereço" value={selectedCompany.address} />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                   onClick={() => handleToggleStatus(selectedCompany.id, selectedCompany.status)}
                   className={`flex-1 py-4 font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl transition-all border shadow-sm active:scale-[0.98] ${
                    selectedCompany.status === 'active' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:shadow-md' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:shadow-md'
                  }`}
                >
                  {selectedCompany.status === 'active' ? "Suspender Acesso" : "Ativar Acesso"}
                </button>
                <button 
                  onClick={() => handleDelete(selectedCompany.id, selectedCompany.name)}
                  className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    active: { icon: CheckCircle2, text: "Ativa", class: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50" },
    suspended: { icon: AlertCircle, text: "Suspensa", class: "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50" },
    inactive: { icon: Clock, text: "Inativa", class: "bg-slate-50 text-slate-700 border-slate-100 shadow-slate-100/50" }
  };
  const config = configs[status] || configs.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl border shadow-sm ${config.class}`}>
      <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
      {config.text}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="flex gap-5 group/item">
      <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover/item:text-primary-500 group-hover/item:bg-primary-50 transition-all duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-hover/item:text-primary-400 transition-colors">{label}</p>
        <p className="font-bold text-slate-900 text-sm md:text-base">{value || "Não informado"}</p>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}