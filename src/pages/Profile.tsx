import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Camera, Save, Lock, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPut } from "../lib/api";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    }
  };

  const handleChangePassword = () => {
    Swal.fire({
      title: 'Alterar Senha',
      html: `
        <input id="swal-password1" class="swal2-input" type="password" placeholder="Senha atual">
        <input id="swal-password2" class="swal2-input" type="password" placeholder="Nova senha">
        <input id="swal-password3" class="swal2-input" type="password" placeholder="Confirmar nova senha">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Alterar Senha',
      confirmButtonColor: '#2563eb',
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

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      Swal.fire('Erro!', 'Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Erro!', 'A imagem deve ter no máximo 2MB.', 'error');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Enviar para servidor
    Swal.fire({
      icon: 'success',
      title: 'Foto atualizada!',
      text: 'A foto de perfil foi alterada com sucesso.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Carregar avatar salvo (se houver)
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatarPreview(savedAvatar);
    }
  }, []);

  if (!profile) return <div className="p-8 text-slate-500 font-bold animate-pulse">Carregando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Configurações de Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie a sua identidade e segurança na plataforma Salya Admin.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bento-card p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-28 h-28 bg-primary-50 rounded-[2.5rem] flex items-center justify-center text-3xl font-black text-primary-600 shadow-lg shadow-primary-500/10 border-4 border-white overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all border-2 border-white shadow-lg group"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
            <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em] mt-1">{profile.role}</p>

            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Principal</p>
                  <p className="text-sm font-bold text-slate-700">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Shield className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Último Acesso</p>
                  <p className="text-sm font-bold text-slate-700">Hoje às 10:45</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form: Details */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bento-card p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Editar Informações</h4>
              <button 
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline"
              >
                {isEditing ? "Cancelar" : "Modificar"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço de E-mail</label>
                <input 
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-60"
                />
              </div>
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-end"
              >
                <button 
                  type="submit"
                  className="px-10 py-4 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Save className="w-4 h-4" /> Gravar Alterações
                </button>
              </motion.div>
            )}
          </form>

          <div className="bento-card p-8 md:p-10 border-rose-100 bg-rose-50/20">
            <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Lock className="w-5 h-5 text-rose-500" /> Segurança da Conta
            </h4>
            <p className="text-sm text-slate-500 mt-2">Altere a sua palavra-passe regularmente para manter a conta segura.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={handleChangePassword} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                Alterar Senha
              </button>
              <button onClick={handleDeactivateAccount} className="px-8 py-3.5 border border-rose-200 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Desativar Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
