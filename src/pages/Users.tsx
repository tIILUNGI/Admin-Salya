import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserPlus, Filter, Shield, MoreHorizontal, Ban, RefreshCw, Unlock, Eye, Edit, Trash2, FileText, Building2, Calendar, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { formatDate } from "../lib/formatters";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [filterRole, setFilterRole] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [isDetectingSimilar, setIsDetectingSimilar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Utilizadores | Salya Admin";
  }, []);

  const fetchUsers = () => {
    apiGet("/admin/users")
      .then(res => res.json())
      .then(usersData => {
        apiGet("/admin/companies")
          .then(res => res.json())
          .then(companiesData => {
            const companiesList = Array.isArray(companiesData) ? companiesData : [];
            const companiesMap: Record<string, any> = {};

            companiesList.forEach((company: any) => {
              if (company.id !== undefined && company.id !== null) {
                companiesMap[String(company.id)] = company;
              }
              if (company.userId) {
                companiesMap[`user_${String(company.userId)}`] = company;
              }
              if (company.ownerId) {
                companiesMap[`owner_${String(company.ownerId)}`] = company;
              }
              if (company.email) {
                companiesMap[`email_${String(company.email).toLowerCase()}`] = company;
              }
            });
            setCompanies(companiesMap);

            const enrichedUsers = (() => {
              // Deduplicate raw users list by ID or Email
              const uniqueUsersMap = new Map<string, any>();
              (Array.isArray(usersData) ? usersData : []).forEach((u: any) => {
                const key = u.id !== undefined && u.id !== null 
                  ? `id_${String(u.id)}` 
                  : (u.email ? `email_${String(u.email).toLowerCase().trim()}` : JSON.stringify(u));
                if (!uniqueUsersMap.has(key)) {
                  uniqueUsersMap.set(key, u);
                }
              });
              const uniqueUsersList = Array.from(uniqueUsersMap.values());

              return uniqueUsersList.map((user: any) => {
                let resolvedCompanyName: string | null = null;
                const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'Super Admin' || user.type === 'ADMIN';

                if (!isAdmin) {
                  // 1. Explicit company name fields on user object
                  if (user.companyName) {
                    resolvedCompanyName = user.companyName;
                  } else if (user.company?.name) {
                    resolvedCompanyName = user.company.name;
                  } else if (user.Company?.name) {
                    resolvedCompanyName = user.Company.name;
                  } else if (user.empresa?.name) {
                    resolvedCompanyName = user.empresa.name;
                  } else if (user.empresaName) {
                    resolvedCompanyName = user.empresaName;
                  }

                  // 2. Explicit foreign key on user (companyId / company_id / empresaId)
                  const uCompId = user.companyId ?? user.company_id ?? user.CompanyId ?? user.empresaId ?? user.empresa_id;
                  if (!resolvedCompanyName && uCompId !== undefined && uCompId !== null && uCompId !== 0) {
                    const matched = companiesMap[String(uCompId)];
                    if (matched) {
                      resolvedCompanyName = matched.name || matched.nomeComercial || matched.companyName || null;
                    }
                  }

                  // 3. Foreign key on company referencing user ID (company.userId or company.ownerId)
                  if (!resolvedCompanyName && user.id !== undefined && user.id !== null) {
                    const matchedByUser = companiesMap[`user_${String(user.id)}`] || companiesMap[`owner_${String(user.id)}`];
                    if (matchedByUser) {
                      resolvedCompanyName = matchedByUser.name || matchedByUser.nomeComercial || null;
                    }
                  }

                  // 4. Strict owner email match (only if explicit ID was missing)
                  if (!resolvedCompanyName && user.email) {
                    const foundByEmail = companiesList.find((c: any) =>
                      (c.ownerEmail && c.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
                      (c.userEmail && c.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
                    );
                    if (foundByEmail) {
                      resolvedCompanyName = foundByEmail.name || foundByEmail.nomeComercial || foundByEmail.companyName || null;
                    }
                  }
                }

                return {
                  ...user,
                  companyName: isAdmin ? (user.companyName || 'Administração') : resolvedCompanyName
                };
              });
            })();

            setUsers(enrichedUsers);
          })
          .catch(() => {
            setCompanies({});
            setUsers(Array.isArray(usersData) ? usersData : []);
          });
      })
      .catch(() => setUsers([]));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      text: `Deseja realmente ${actionLabel} este utilizador?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
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
      text: `Utilizador ${actionLabel} com sucesso`,
      confirmButtonColor: "#4f46e5",
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
      confirmButtonColor: "#4f46e5",
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
          confirmButtonColor: "#4f46e5",
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
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Telefone:</strong> ${user.phone || 'Não informado'}</p>
          <p><strong>Papel:</strong> ${user.role}</p>
          <p><strong>Empresa:</strong> ${user.companyName || 'Sem Empresa'}</p>
          <p><strong>Plano Atual:</strong> ${user.activePlanName || user.planType || 'DEMO'}</p>
          <p><strong>Estado Subscrição:</strong> ${user.subscriptionStatus || 'N/A'}</p>
          <p><strong>Status Conta:</strong> ${user.status}</p>
          <p><strong>Data Cadastro:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      `,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Fechar"
    });
  };

  const handleViewHistory = async (id: string) => {
    try {
      const res = await apiGet(`/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch user history");
      const data = await res.json();
      
      const subsHtml = data.subscriptions?.map((s: any) => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;">
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

      const paymentsHtml = data.payments?.map((p: any) => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;">
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
        title: `Histórico: ${data.user?.name || 'Utilizador'}`,
        html: `
          <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <h4 style="margin-top:0; color:#4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom:4px;">Subscrições</h4>
            ${subsHtml}
            <h4 style="margin-top:20px; color:#4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom:4px;">Pagamentos</h4>
            ${paymentsHtml}
          </div>
        `,
        width: '600px',
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "Fechar"
      });
    } catch (err) {
      Swal.fire("Erro", "Não foi possível carregar o histórico", "error");
    }
  };

  const handleEditUser = (user: any) => {
    Swal.fire({
      title: 'Editar Utilizador',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Nome Completo</label>
            <input id="swal-name" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" placeholder="Nome" value="${user.name.replace(/"/g, '&quot;')}">
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Email</label>
            <input id="swal-email" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" type="email" placeholder="Email" value="${user.email}">
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Papel / Cargo</label>
            <select id="swal-role" class="swal2-select" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px; display: flex;">
              <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>Utilizador Comum</option>
              <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Nova Senha (opcional)</label>
            <input id="swal-password" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" type="password" placeholder="••••••••">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar Alterações',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
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
            Swal.fire('Atualizado!', 'Utilizador atualizado com sucesso.', 'success');
          }
        } catch (err) {
          Swal.fire('Erro!', 'Não foi possível atualizar o utilizador.', 'error');
        }
      }
    });
  };

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: 'Excluir Utilizador?',
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
        Swal.fire('Removido!', 'Utilizador excluído com sucesso.', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      Swal.fire('Erro!', 'Não foi possível excluir o utilizador.', 'error');
    }
  };

  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Criar Novo Utilizador',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Nome Completo</label>
            <input id="swal-name" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" placeholder="Nome">
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Email</label>
            <input id="swal-email" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" type="email" placeholder="Email">
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Papel / Cargo</label>
            <select id="swal-role" class="swal2-select" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px; display: flex;">
              <option value="USER">Utilizador Comum</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">ID da Empresa (opcional)</label>
            <input id="swal-companyId" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" placeholder="ID da empresa">
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">Senha Provisória</label>
            <input id="swal-password" class="swal2-input" style="width: 100%; margin: 0; height: 40px; border-radius: 10px; font-size: 13px;" type="password" placeholder="••••••••">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Criar Utilizador',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      width: '450px',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;
        const companyId = (document.getElementById('swal-companyId') as HTMLInputElement).value;
        if (!name || !email) {
          Swal.showValidationMessage('Nome e email são obrigatórios');
          return false;
        }
        return { name, email, password, role, companyId };
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
          companyId: formValues.companyId || null
        });

        if (res.ok) {
          const newUser = await res.json();
          const enrichedUser = {
            ...newUser,
            companyName: companies[String(newUser.companyId)]?.name || null
          };
          setUsers([enrichedUser, ...users]);
          Swal.fire({
            icon: "success",
            title: "Utilizador Criado!",
            text: "Novo utilizador adicionado com sucesso",
            confirmButtonColor: "#4f46e5",
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível criar o utilizador",
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
      Swal.fire("Erro", "Falha ao detectar utilizadores semelhantes", "error");
    } finally {
      setIsDetectingSimilar(false);
    }
  };

  const handleDatePreset = (preset: 'today' | '7days' | '30days' | 'month' | 'clear') => {
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];

    if (preset === 'clear') {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === 'today') {
      setStartDate(toStr);
      setEndDate(toStr);
      return;
    }

    let from = new Date();
    if (preset === '7days') {
      from.setDate(today.getDate() - 7);
    } else if (preset === '30days') {
      from.setDate(today.getDate() - 30);
    } else if (preset === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    setStartDate(from.toISOString().split('T')[0]);
    setEndDate(toStr);
  };

  const isFilterActive = filterRole !== "ALL" || Boolean(startDate) || Boolean(endDate);

  const filteredUsers = users.filter(u => {
    const name = u.name?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    const company = u.companyName?.toLowerCase() || "";

    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                          email.includes(searchTerm.toLowerCase()) ||
                          company.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;

    let matchesDate = true;
    if (startDate || endDate) {
      if (u.createdAt) {
        const userDate = new Date(u.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (userDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (userDate > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active' || u.status === 'ACTIVE').length;
  const adminUsers = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Utilizadores</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDetectSimilar}
            disabled={isDetectingSimilar}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
          >
            {isDetectingSimilar ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
            Detectar Duplicados
          </button>
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Novo Utilizador
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex items-center gap-8 py-2 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Total de Contas</span>
          <span className="text-2xl font-extrabold text-slate-900">{totalUsers}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Ativos</span>
          <span className="text-2xl font-extrabold text-emerald-600">{activeUsers}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Administradores</span>
          <span className="text-2xl font-extrabold text-indigo-600">{adminUsers}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou empresa"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold transition-all ${
            showFilters || isFilterActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {isFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
        </button>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Papel / Cargo</label>
              <div className="flex gap-2">
                {['ALL', 'ADMIN', 'USER'].map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filterRole === role ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {role === 'ALL' ? 'Todos' : role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500 font-semibold bg-transparent">
                <th className="py-3.5 px-6 font-semibold">Utilizador</th>
                <th className="py-3.5 px-6 font-semibold hidden md:table-cell">Email</th>
                <th className="py-3.5 px-6 font-semibold hidden lg:table-cell">Empresa</th>
                <th className="py-3.5 px-6 font-semibold hidden lg:table-cell">Registo</th>
                <th className="py-3.5 px-6 font-semibold hidden md:table-cell">Papel</th>
                <th className="py-3.5 px-6 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 bg-transparent">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-100/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block">{user.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal md:hidden">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono hidden md:table-cell">{user.email}</td>
                  <td className="py-4 px-6 text-slate-600 hidden lg:table-cell">
                    {user.companyName ? (
                      <span className="font-semibold text-slate-800">{user.companyName}</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold text-[11px]">
                        Sem Empresa
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono hidden lg:table-cell">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${
                      user.status === 'active' ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'
                    }`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5 relative">
                      <button
                        onClick={() => handleToggleBlock(user.id, user.status)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          user.status === 'active'
                            ? 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                            : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                      >
                        {user.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
                        title="Resetar senha"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
                        title="Mais opções"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openMenuId === user.id && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-left">
                          <button
                            onClick={() => { handleViewUser(user); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" /> Perfil
                          </button>
                          <button
                            onClick={() => { handleViewHistory(user.id); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Histórico
                          </button>
                          <button
                            onClick={() => { handleEditUser(user); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" /> Editar
                          </button>
                          <button
                            onClick={() => { handleDeleteUser(user); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhum utilizador encontrado com os critérios fornecidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Duplicados */}
      {showSimilarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowSimilarModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Utilizadores Semelhantes</h3>
              <button onClick={() => setShowSimilarModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {similarUsers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhum registo duplicado detectado.</p>
              ) : (
                similarUsers.map((pair, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold mb-2">
                      {pair.reason}
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-slate-900">{pair.user1?.name}</p>
                        <p className="text-slate-500">{pair.user1?.email}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{pair.user2?.name}</p>
                        <p className="text-slate-500">{pair.user2?.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowSimilarModal(false)}
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