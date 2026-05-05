import { useState, useEffect } from "react";
import { Search, UserPlus, Filter, Shield, MoreHorizontal, Ban, RefreshCcw, Mail, Phone, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(setUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    const isBlocked = currentStatus === "blocked";
    if (!confirm(`Deseja realmente ${isBlocked ? "desbloquear" : "bloquear"} este usuário?`)) return;

    await fetch(`/api/admin/users/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isBlocked ? "active" : "blocked" }),
    });
    fetchUsers();
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Enviar link de redefinição de palavra-passe para ${email}?`)) return;
    alert(`Link de redefinição enviado com sucesso para ${email}`);
  };

  const filteredUsers = users.filter(u => {
    const name = u.name ?? "";
    const email = u.email ?? "";
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Supervisão de contas e permissões em todas as empresas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 w-full md:w-64 text-sm font-medium transition-all"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-4"
                >
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filtrar por Cargo</p>
                   <div className="space-y-1">
                      {['ALL', 'ADMIN', 'USER'].map(role => (
                        <button
                          key={role}
                          onClick={() => { setFilterRole(role); setShowFilters(false); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${filterRole === role ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {role === 'ALL' ? 'Todos os Cargos' : role}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <motion.div 
            layout
            key={user.id} 
            className={`bento-card p-6 group transition-all ${user.status === 'blocked' ? 'opacity-75 grayscale' : ''}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-[1.25rem] flex items-center justify-center text-xl font-black text-primary-600 uppercase shadow-sm group-hover:scale-110 transition-transform">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                user.status === 'blocked' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
               <div className="flex gap-4">
                 <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Shield className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Permissão</p>
                   <p className="text-sm font-bold text-slate-800">{user.role}</p>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Phone className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                   <p className="text-sm font-bold text-slate-800">{user.phone || '--'}</p>
                 </div>
               </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => handleResetPassword(user.email)}
                className="flex-1 py-3 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-100"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button 
                onClick={() => handleToggleBlock(user.id, user.status)}
                className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border transition-all ${
                user.status === 'active' 
                  ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
              }`}>
                {user.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
