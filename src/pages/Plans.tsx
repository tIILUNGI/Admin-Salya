import React, { useState, useEffect } from "react";
import { Plus, Package, Edit2, CheckCircle, Trash2, X, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    price: 0, 
    durationDays: 30, 
    isActive: true,
    type: "SEMESTRAL",
    category: "PAGO"
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Planos | Salya Admin";
  }, []);

  const fetchPlans = () => {
    apiGet("/admin/plans")
      .then(res => res.json())
      .then(setPlans)
      .catch(() => setPlans([]));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = editingPlan 
        ? await apiPut(`/admin/plans/${editingPlan.id}`, formData)
        : await apiPost('/admin/plans', formData);
      if (response.ok) {
        fetchPlans();
        closeModal();
        Swal.fire({
          icon: 'success',
          title: editingPlan ? 'Atualizado!' : 'Criado!',
          text: `Plano ${editingPlan ? 'atualizado' : 'criado'} com sucesso`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('Erro ao salvar plano');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao salvar plano'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Tem a certeza?",
      text: "Esta ação removerá o plano permanentemente!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    await apiDelete(`/admin/plans/${id}`);
    fetchPlans();
    
    Swal.fire({
      icon: "success",
      title: "Removido!",
      text: "Plano removido com sucesso",
      confirmButtonColor: "#9333ea",
      timer: 1500,
      showConfirmButton: false
    });
  };

// handleSubmit duplicado removido


  const openModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ 
        name: plan.name, 
        price: plan.price, 
        durationDays: plan.durationDays, 
        isActive: plan.isActive,
        type: plan.type || "SEMESTRAL",
        category: plan.category || "PAGO"
      });
    } else {
      setEditingPlan(null);
      setFormData({ 
        name: "", 
        price: 0, 
        durationDays: 30, 
        isActive: true,
        type: "SEMESTRAL",
        category: "PAGO"
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Planos</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Criação e manutenção de planos de subscrição.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary-500/20 whitespace-nowrap"
          title="Novo Plano"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 italic-none">
          {plans.map((plan, idx) => (
            <div key={plan.id} className="relative group">
              <div className="absolute inset-0 bg-primary-500 rounded-[3rem] rotate-1 scale-95 opacity-0 group-hover:opacity-5 group-hover:rotate-2 transition-all duration-500" />

            <div className={`relative bg-white border-2 border-slate-100 p-10 rounded-lg flex flex-col h-full hover:border-primary-100 transition-all ${idx === 1 ? 'ring-2 ring-primary-500/20' : ''}`}>
              
              {idx === 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-3 h-3" /> Recomendado
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${idx === 1 ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'}`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(plan)}
                    className="p-2.5 bg-slate-50 hover:bg-primary-50 rounded-lg text-slate-400 hover:text-primary-600 transition-all"
                    title="Editar Plano"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="p-2.5 bg-slate-50 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                    title="Excluir Plano"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{plan.name}</h3>
                <div className="flex flex-col gap-1 mt-6">
                  <span className="text-4xl font-black text-slate-900 leading-none">{formatCurrency(plan.price)}</span>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 px-2 py-1 bg-slate-50 rounded-lg inline-block w-fit">Recorrência: {plan.durationDays} Dias</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 border-t border-slate-50 pt-8">
                <FeatureItem text="Acesso total à API" />
                <FeatureItem text="Suporte Prioritário" />
                <FeatureItem text={`Validade de ${plan.durationDays} dias`} />
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-dashed ${plan.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                   {plan.isActive ? 'Disponível' : 'Indisponível'}
                </span>
                <div className="text-[10px] font-bold uppercase text-slate-300 tracking-tighter">REF: {plan.id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-60" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden shadow-emerald-900/10 z-61"
            >
              <div className="p-6 md:p-8 italic-none">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingPlan ? "Actualizar Plano" : "Criar Novo Plano"}
                  </h2>
                  <button onClick={closeModal} className="p-2.5 hover:bg-slate-100 rounded-lg transition-all" title="Fechar">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designação Comercial</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Prime Corporate"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-lg py-2.5 px-5 outline-none focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Plano</label>
                        <select 
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-lg py-2.5 px-5 outline-none focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 text-sm"
                          title="Tipo de Plano"
                        >
                          <option value="DEMO">DEMO</option>
                          <option value="SEMESTRAL">SEMESTRAL</option>
                          <option value="ANUAL">ANUAL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-lg py-2.5 px-5 outline-none focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 text-sm"
                          title="Categoria de Plano"
                        >
                          <option value="PAGO">PAGO</option>
                          <option value="GRATUITO">GRATUITO</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Preço (Kz)</label>
                        <input 
                          type="number" 
                          required
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                          title="Preço"
                          placeholder="0"
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-lg py-2.5 px-5 outline-none focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ciclo (Dias)</label>
                        <input 
                          type="number" 
                          required
                          value={formData.durationDays}
                          onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                          title="Duração em dias"
                          placeholder="30"
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-lg py-2.5 px-5 outline-none focus:border-primary-600 focus:bg-white transition-all font-bold text-slate-900 text-sm"
                        />
                      </div>
                    </div>

                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-bold text-slate-700">Estado de Venda</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativo / Inativo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                        title="Ativar ou Desativar Plano"
                        placeholder="Ativo"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 uppercase tracking-wide text-xs mt-4"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                    Guardar Configuração
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
      <div className="p-1 bg-primary-50 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
      </div>
      {text}
    </div>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  );
}
