import { useState, useEffect } from "react";
import { Search, UserPlus, Filter, Shield, MoreHorizontal, Ban, RefreshCcw, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";

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
    
    const result = await Swal.fire({
      title: "Tem a certeza?",
      text: `Deseja realmente ${isBlocked ? "desbloquear" : "bloquear"} este usuário?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;

    await fetch(`/api/admin/users/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isBlocked ? "active" : "blocked" }),
    });
    fetchUsers();
    
    Swal.fire({
      icon: "success",
      title: "Sucesso!",
      text: `Usuário ${isBlocked ? "desbloqueado" : "bloqueado"} com sucesso`,
      confirmButtonColor: "#2563eb",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleResetPassword = async (email: string) => {
    const result = await Swal.fire({
      title: "Enviar link de recuperação?",
      text: `Enviar link de redefinição de palavra-passe para ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    Swal.fire({
      icon: "success",
      title: "Email Enviado!",
      text: "Link de redefinição enviado com sucesso",
      confirmButtonColor: "#2563eb",
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Criar Novo Usuário',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nome">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Email">' +
        '<input id="swal-input3" class="swal2-input" type="password" placeholder="Senha (opcional)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Criar Usuário',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      preConfirm: () => {
        const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const email = (document.getElementById('swal-input2') as HTMLInputElement).value;
        const password = (document.getElementById('swal-input3') as HTMLInputElement).value;
        if (!name || !email) {
          Swal.showValidationMessage('Nome e email são obrigatórios');
          return false;
        }
        return { name, email };
      }
    });

    if (formValues) {
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formValues.name,
            email: formValues.email,
            role: "USER",
            status: "active",
            phone: "",
            companyId: ""
          }),
        });

        if (res.ok) {
          const newUser = await res.json();
          setUsers([newUser, ...users]);
          Swal.fire({
            icon: "success",
            title: "Usuário Criado!",
            text: "Novo usuário adicionado com sucesso",
            confirmButtonColor: "#2563eb",
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível criar o usuário",
          confirmButtonColor: "#ef4444"
        });
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const name = u.name?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                         email.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Controle total de acessos, bloqueios e criação de usuários.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-500/20"
          >
            <UserPlus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${showFilters ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'}`}
            >
              <Filter className="w-4 h-4" />
              Filtro
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-slate-100 bg-slate-50/50"
          >
            <div className="flex flex-wrap gap-2">
              {['ALL', 'ADMIN', 'USER'].map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterRole === role ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{user.companyId || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      } border`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                      } border`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleBlock(user.id, user.status)}
                          className={`p-2.5 rounded-xl transition-all shadow-sm ${
                            user.status === 'active' 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={user.status === 'active' ? 'Bloquear usuário' : 'Desbloquear usuário'}
                        >
                          {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResetPassword(user.email)}
                          className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-primary-600 border border-slate-200 transition-all shadow-sm"
                          title="Resetar senha"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 transition-all shadow-sm"
                          title="Mais opções"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-slate-500 font-medium">Tente ajustar os filtros ou criar um novo usuário</p>
          </div>
        )}
      </div>
    </div>
  );
}
