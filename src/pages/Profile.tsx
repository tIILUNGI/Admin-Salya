import React, { useState, useEffect, useRef } from "react";
import { Mail, Shield, Camera, Save, Lock, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { apiGet, apiPut } from "../lib/api";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Perfil | Salya Admin";
  }, []);

  useEffect(() => {
    apiGet("/admin/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setFormData({ name: data.name, email: data.email });
      })
      .catch(() => setProfile(null));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPut("/admin/profile", formData);
      const updated = await res.json();
      setProfile(updated);
      setIsEditing(false);
      Swal.fire({
        icon: 'success',
        title: 'Perfil Atualizado!',
        text: 'Suas informações foram salvas com sucesso.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Erro!', 'Erro ao atualizar perfil.', 'error');
    }
  };

  const handleChangePassword = () => {
    Swal.fire({
      title: 'Alterar Senha',
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
          <input id="swal-password1" class="swal2-input" style="width:100%; margin:0; font-size:13px; height:40px; border-radius:8px;" type="password" placeholder="Senha atual">
          <input id="swal-password2" class="swal2-input" style="width:100%; margin:0; font-size:13px; height:40px; border-radius:8px;" type="password" placeholder="Nova senha">
          <input id="swal-password3" class="swal2-input" style="width:100%; margin:0; font-size:13px; height:40px; border-radius:8px;" type="password" placeholder="Confirmar nova senha">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Alterar Senha',
      confirmButtonColor: '#4f46e5',
      preConfirm: () => {
        const current = (document.getElementById('swal-password1') as HTMLInputElement).value;
        const newPass = (document.getElementById('swal-password2') as HTMLInputElement).value;
        const confirm = (document.getElementById('swal-password3') as HTMLInputElement).value;
        if (!current || !newPass || !confirm) {
          Swal.showValidationMessage('Preencha todos os campos');
          return false;
        }
        if (newPass !== confirm) {
          Swal.showValidationMessage('Senhas não coincidem');
          return false;
        }
        return { current, newPass };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiPut("/admin/profile", { password: result.value.newPass });
          Swal.fire('Senha alterada!', 'Sua senha foi atualizada com sucesso.', 'success');
        } catch (err) {
          Swal.fire('Erro!', 'Não foi possível alterar a senha.', 'error');
        }
      }
    });
  };

  const handleDeactivateAccount = () => {
    Swal.fire({
      title: 'Desativar Conta?',
      text: 'Esta ação é irreversível. Tem certeza?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, desativar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Conta desativada!', 'Sua conta foi desativada.', 'success');
      }
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('Erro!', 'Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Erro!', 'A imagem deve ter no máximo 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      localStorage.setItem('user_avatar', reader.result as string);
    };
    reader.readAsDataURL(file);

    Swal.fire({
      icon: 'success',
      title: 'Foto atualizada!',
      text: 'A foto de perfil foi alterada com sucesso.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatarPreview(savedAvatar);
    }
  }, []);

  if (!profile) return <div className="p-8 text-slate-500 font-bold animate-pulse">Carregando perfil...</div>;

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Perfil de Administrador</h1>
        <p className="text-xs text-slate-500 mt-1">Gerencie a sua conta e definições de acesso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xs">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-2xs overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0).toUpperCase() || "A"
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-xs"
              title="Alterar foto"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <h3 className="font-bold text-slate-900 text-base">{profile.name}</h3>
          <span className="inline-block px-2.5 py-0.5 mt-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold uppercase">
            {profile.role || "ADMIN"}
          </span>

          <div className="w-full mt-6 pt-4 border-t border-slate-200/60 text-left text-xs space-y-3">
            <div>
              <span className="text-slate-400 block font-medium text-[11px]">Email</span>
              <span className="font-semibold text-slate-700">{profile.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium text-[11px]">Estado da Conta</span>
              <span className="font-semibold text-emerald-600">Ativo</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Details & Security */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h3 className="font-bold text-slate-900 text-sm">Informações Pessoais</h3>
              <button 
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nome Completo</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium disabled:bg-slate-100/70"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email</label>
                <input 
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium disabled:bg-slate-100/70"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações
                </button>
              </div>
            )}
          </form>

          {/* Security */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200/60 pb-3">Segurança</h3>
            <p className="text-slate-500">Mantenha a sua palavra-passe segura e atualizada.</p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                Alterar Senha
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition-all"
              >
                Desativar Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
