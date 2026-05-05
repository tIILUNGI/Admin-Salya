import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Search, Filter, Eye, Ban, CheckCircle2, AlertCircle, Trash2, X, Users, Mail, Phone, MapPin, Hash } from "lucide-react";
import { formatDate } from "../lib/formatters";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";

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
    fetch("/api/admin/companies")
      .then(res => res.json())
      .then(setCompanies);
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
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          plan: "Trial",
          status: "active",
          trial: true,
          employees: 1,
          email: "contact@" + name.toLowerCase().replace(/\s/g, '') + ".com",
          phone: "",
          nif: "",
          address: "",
          createdAt: new Date().toISOString()
        }),
      });
      
      if (res.ok) {
        const newCompany = await res.json();
        setCompanies([...companies, newCompany]);
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Empresa criada com sucesso",
          confirmButtonColor: "#2563eb"
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
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    await fetch(`/api/admin/companies/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
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
    
    await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
    fetchCompanies();
    setSelectedCompany(null);
    
    Swal.fire({
      icon: "success",
      title: "Removida!",
      text: "A empresa foi removida com sucesso",
      confirmButtonColor: "#2563eb"
    });
  };

  const viewDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${id}`);
      const data = await res.json();
      setSelectedCompany(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Gestão de Empresas</h1>
          <p className="text-slate-500 mt-1">Controle de cadastros, status e informações das empresas parceiras.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Empresa
        </button>
      </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 w-full text-sm font-medium transition-all"
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors hover:border-primary-200">
              <Filter className="w-5 h-5" />
            </button>
          </div>

      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Empresa</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Plano</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-primary-50/20 transition-colors group">
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-sm md:text-base">{company.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Desde {formatDate(company.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      company.trial ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                    }`}>
                      {company.plan} {company.trial && '• TRIAL'}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-600 font-bold text-sm">
                       <Users className="w-4 h-4 text-slate-400" />
                       {company.employees || 0}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => viewDetails(company.id)}
                        className="p-2 md:p-2.5 bg-white border border-slate-100 hover:bg-primary-50 text-primary-600 rounded-xl shadow-sm transition-all"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 md:w-4.5 h-4 md:h-4.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(company.id, company.status)}
                        className={`p-2 md:p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm transition-all ${
                          company.status === 'active' ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'
                        }`}
                        title={company.status === 'active' ? "Suspender" : "Ativar"}
                      >
                        {company.status === 'active' ? <Ban className="w-4 md:w-4.5 h-4 md:h-4.5" /> : <CheckCircle2 className="w-4 md:w-4.5 h-4 md:h-4.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="p-2 md:p-2.5 bg-white border border-slate-100 hover:bg-rose-50 text-rose-600 rounded-xl shadow-sm transition-all"
                        title="Remover"
                      >
                        <Trash2 className="w-4 md:w-4.5 h-4 md:h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompany(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-10"
            >
              <button 
                onClick={() => setSelectedCompany(null)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                <div className="w-24 h-24 bg-primary-50 rounded-[2rem] flex items-center justify-center text-primary-600 text-3xl font-black shadow-lg shadow-primary-500/10">
                  {selectedCompany.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight">{selectedCompany.name}</h3>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <StatusBadge status={selectedCompany.status} />
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-widest border border-slate-200">
                      Plano {selectedCompany.plan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                <InfoItem icon={Mail} label="Email de Contacto" value={selectedCompany.email} />
                <InfoItem icon={Phone} label="Telefone" value={selectedCompany.phone} />
                <InfoItem icon={Hash} label="NIF" value={selectedCompany.nif} />
                <InfoItem icon={Users} label="Total Colaboradores" value={selectedCompany.employees} />
                <div className="md:col-span-2">
                  <InfoItem icon={MapPin} label="Endereço" value={selectedCompany.address} />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                   onClick={() => handleToggleStatus(selectedCompany.id, selectedCompany.status)}
                   className={`flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all border ${
                    selectedCompany.status === 'active' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                  }`}
                >
                  {selectedCompany.status === 'active' ? "Suspender Acesso" : "Ativar Acesso"}
                </button>
                <button 
                  onClick={() => handleDelete(selectedCompany.id, selectedCompany.name)}
                  className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    active: { icon: CheckCircle2, text: "Ativa", class: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    suspended: { icon: AlertCircle, text: "Suspensa", class: "bg-rose-50 text-rose-700 border-rose-100" },
    inactive: { icon: Clock, text: "Inativa", class: "bg-slate-50 text-slate-700 border-slate-100" }
  };
  const config = configs[status] || configs.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full border ${config.class}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      {config.text}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="flex gap-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-slate-900">{value || "Não informado"}</p>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}
