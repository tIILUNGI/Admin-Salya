import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserPlus, Filter, Shield, MoreHorizontal, Ban, RefreshCcw, Unlock, Eye, Edit, Trash2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [isDetectingSimilar, setIsDetectingSimilar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = "Usuários | Salya Admin";
  }, []);

  const fetchUsers = () => {
    apiGet("/admin/users")
      .then(res => res.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sincronizar search com query param
  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    setSearchTerm(querySearch);
  }, [searchParams]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    let actionLabel = "desativar";
    let endpoint = `/admin/users/${id}/toggle-status`;

    if (currentStatus === "suspended") {
      actionLabel = "desbloquear";
      endpoint = `/admin/users/${id}/unlock`;
    } else if (currentStatus === "inactive") {
      actionLabel = "ativar";
      endpoint = `/admin/users/${id}/toggle-status`;
    } else if (currentStatus === "active") {
      actionLabel = "desativar";
      endpoint = `/admin/users/${id}/toggle-status`;
    }

    const result = await Swal.fire({
      title: "Tem a certeza?",
      text: `Deseja realmente ${actionLabel} este usuário?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#9333ea",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;

    await apiPost(endpoint, {});
    fetchUsers();
    
    Swal.fire({
      icon: "success",
      title: "Sucesso!",
      text: `Usuário ${actionLabel} com sucesso`,
      confirmButtonColor: "#9333ea",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleResetPassword = async (id: string, email: string) => {
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
    
    try {
      const res = await apiPost(`/admin/users/${id}/send-reset-link`, {
        frontendUrl: (import.meta as any).env?.VITE_APP_URL || 'https://app.salya.ao',
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Email Enviado!",
          text: "Link de redefinição enviado com sucesso",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error("Failed to send link");
      }
    } catch (err) {
      Swal.fire("Erro", "Não foi possível enviar o link de recuperação", "error");
    }
  };

  const handleViewUser = (user: any) => {
    Swal.fire({
      title: user.name,
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Telefone:</strong> ${user.phone || 'Não informado'}</p>
          <p><strong>Papel:</strong> ${user.role}</p>
          <p><strong>Plano Atual:</strong> ${user.activePlanName || user.planType || 'DEMO'}</p>
          <p><strong>Estado Subscrição:</strong> ${user.subscriptionStatus || 'N/A'}</p>
          <p><strong>Status Conta:</strong> ${user.status}</p>
          <p><strong>Data Cadastro:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      `,
      confirmButtonColor: "#9333ea",
      confirmButtonText: "Fechar"
    });
  };

  const handleViewHistory = async (id: string) => {
    try {
      const res = await apiGet(`/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch user history");
      const data = await res.json();
      
      const subsHtml = data.subscriptions.map((s: any) => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">
          <div style="display:flex; justify-content: space-between; font-weight: bold;">
            <span>${s.planName} ${s.durationDays ? `(${s.durationDays} dias)` : ''}</span>
            <span style="color: ${s.status === 'ATIVA' ? '#10b981' : '#6b7280'}">${s.status}</span>
          </div>
          <div style="color: #666; font-size: 11px;">
            ${new Date(s.startDate).toLocaleDateString()} - ${s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}
          </div>
          <div style="font-weight: bold; margin-top: 4px;">Kz ${s.price?.toLocaleString() || '0'}</div>
        </div>
      `).join('') || '<p style="text-align:center; color:#999; padding:20px;">Nenhuma subscrição encontrada</p>';

      const paymentsHtml = data.payments.map((p: any) => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">
          <div style="display:flex; justify-content: space-between;">
            <span style="font-weight: bold;">Kz ${p.amount.toLocaleString()}</span>
            <span style="color: ${p.status === 'CONFIRMADO' ? '#10b981' : '#f59e0b'}">${p.status}</span>
          </div>
          <div style="color: #666; font-size: 11px;">
            ${p.date ? new Date(p.date).toLocaleDateString() : 'N/A'} - ${p.method || 'Transferência'}
          </div>
        </div>
      `).join('') || '<p style="text-align:center; color:#999; padding:20px;">Nenhum pagamento encontrado</p>';

      Swal.fire({
        title: `Histórico: ${data.user.name}`,
        html: `
          <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <h4 style="margin-top:0; color:#9333ea; border-bottom: 2px solid #9333ea; padding-bottom:4px;">Subscrições</h4>
            ${subsHtml}
            <h4 style="margin-top:20px; color:#9333ea; border-bottom: 2px solid #9333ea; padding-bottom:4px;">Pagamentos</h4>
            ${paymentsHtml}
          </div>
        `,
        width: '600px',
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Fechar"
      });
    } catch (err) {
      Swal.fire("Erro", "Não foi possível carregar o histórico", "error");
    }
  };

  const handleEditUser = (user: any) => {
    Swal.fire({
      title: 'Editar Usuário',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Nome Completo</label>
            <input id="swal-name" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" placeholder="Nome" value="${user.name}">
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Email</label>
            <input id="swal-email" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" type="email" placeholder="Email" value="${user.email}">
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Papel / Cargo</label>
            <select id="swal-role" class="swal2-select" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px; display: flex;">
              <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>Usuário Comum</option>
              <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Nova Senha (deixe vazio para não alterar)</label>
            <input id="swal-password" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" type="password" placeholder="••••••••">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar Alterações',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      width: '450px',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;
        if (!name || !email) {
          Swal.showValidationMessage('Nome e email são obrigatórios');
          return false;
        }
        return { name, email, password, role };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await apiPut(`/admin/users/${user.id}`, result.value);
          if (res.ok) {
            fetchUsers();
            Swal.fire('Atualizado!', 'Usuário atualizado com sucesso.', 'success');
          }
        } catch (err) {
          Swal.fire('Erro!', 'Não foi possível atualizar o usuário.', 'error');
        }
      }
    });
  };

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: 'Excluir Usuário?',
      text: `Esta ação é irreversível. Deseja remover ${user.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiDelete(`/admin/users/${user.id}`);
      if (res.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        Swal.fire('Removido!', 'Usuário excluído com sucesso.', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      Swal.fire('Erro!', 'Não foi possível excluir the user.', 'error');
    }
  };

  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Criar Novo Usuário',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Nome Completo</label>
            <input id="swal-name" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" placeholder="Nome">
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Email</label>
            <input id="swal-email" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" type="email" placeholder="Email">
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Papel / Cargo</label>
            <select id="swal-role" class="swal2-select" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px; display: flex;">
              <option value="USER">Usuário Comum</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div style="margin-bottom: 2px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Senha (provisória)</label>
            <input id="swal-password" class="swal2-input" style="width: 100%; margin: 0; height: 44px; border-radius: 12px; font-size: 14px;" type="password" placeholder="••••••••">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Criar Usuário',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      width: '450px',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;
        if (!name || !email) {
          Swal.showValidationMessage('Nome e email são obrigatórios');
          return false;
        }
        return { name, email, password, role };
      }
    });

    if (formValues) {
      try {
        const res = await apiPost("/admin/users", {
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role,
          status: "active",
          phone: "",
          companyId: ""
        });

        if (res.ok) {
          const newUser = await res.json();
          setUsers([newUser, ...users]);
          Swal.fire({
            icon: "success",
            title: "Usuário Criado!",
            text: "Novo usuário adicionado com sucesso",
            confirmButtonColor: "#9333ea",
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

  const handleDetectSimilar = async () => {
    setIsDetectingSimilar(true);
    try {
      const res = await apiGet("/admin/users/similar");
      if (res.ok) {
        const data = await res.json();
        setSimilarUsers(data);
        setShowSimilarModal(true);
      }
    } catch (err) {
      Swal.fire("Erro", "Falha ao detectar usuários semelhantes", "error");
    } finally {
      setIsDetectingSimilar(false);
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
          <button
            onClick={handleDetectSimilar}
            disabled={isDetectingSimilar}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isDetectingSimilar ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
            Detectar Duplicados
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

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Ações</th>
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
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {(user.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-sm md:text-base">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-600 font-mono text-xs md:text-sm">{user.email}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-slate-600 font-medium text-xs md:text-sm">{user.companyId || '-'}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      } border`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                      } border`}>
                        {(user.status || "UNKNOWN").toUpperCase()}
                      </span>
                    </td>
                     <td className="px-4 md:px-6 py-3 md:py-4">
                       <div className="flex items-center gap-1 md:gap-2 relative">
                         <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleBlock(user.id, user.status)}
                          className={`p-2 md:p-2.5 rounded-xl transition-all shadow-sm ${
                            user.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={user.status === 'active' ? 'Bloquear usuário' : 'Desbloquear usuário'}
                        >
                          {user.status === 'active' ? <Ban className="w-3 md:w-4 h-3 md:h-4" /> : <Unlock className="w-3 md:w-4 h-3 md:h-4" />}
                        </motion.button>
                         <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="p-2 md:p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-primary-600 border border-slate-200 transition-all shadow-sm"
                          title="Resetar senha"
                        >
                          <RefreshCcw className="w-3 md:w-4 h-3 md:h-4" />
                        </motion.button>
                        <motion.button
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                           className={`p-2 md:p-2.5 rounded-xl transition-all shadow-sm ${
                             openMenuId === user.id
                               ? 'bg-primary-50 text-primary-600 border border-primary-200'
                               : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200'
                           }`}
                           title="Mais opções"
                         >
                           <MoreHorizontal className="w-3 md:w-4 h-3 md:h-4" />
                         </motion.button>

                         {openMenuId === user.id && (
                           <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                             <button
                               onClick={() => { handleViewUser(user); setOpenMenuId(null); }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                             >
                               <Eye className="w-4 h-4" /> Perfil Detalhado
                             </button>
                             <button
                               onClick={() => { handleViewHistory(user.id); setOpenMenuId(null); }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                             >
                               <FileText className="w-4 h-4" /> Histórico Completo
                             </button>
                             <button
                               onClick={() => { handleEditUser(user); setOpenMenuId(null); }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                             >
                               <Edit className="w-4 h-4" /> Editar Dados
                             </button>
                             <button
                               onClick={() => { handleDeleteUser(user); setOpenMenuId(null); }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" /> Excluir Conta
                             </button>
                           </div>
                         )}
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

      {/* Similar Users Modal */}
      <AnimatePresence>
        {showSimilarModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimilarModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Possíveis Duplicados</h2>
                    <p className="text-slate-500 text-sm">Usuários com nomes ou domínios semelhantes detectados.</p>
                  </div>
                  <button onClick={() => setShowSimilarModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                    <Shield className="w-6 h-6 text-slate-400 rotate-45" />
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-4">
                  {similarUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum duplicado óbvio encontrado</p>
                    </div>
                  ) : (
                    similarUsers.map((pair, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full tracking-widest">
                            {pair.reason}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-8 relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 font-black text-xs z-10">VS</div>
                          <div className="space-y-1">
                            <p className="font-black text-slate-900 text-sm">{pair.user1.name}</p>
                            <p className="text-xs text-slate-500 truncate">{pair.user1.email}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="font-black text-slate-900 text-sm">{pair.user2.name}</p>
                            <p className="text-xs text-slate-500 truncate">{pair.user2.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={() => setShowSimilarModal(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
