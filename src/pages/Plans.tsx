import React, { useState, useEffect } from "react";
import { Plus, Package, Edit2, CheckCircle, Trash2, X, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { formatCurrency } from "../lib/formatters";
import Swal from "sweetalert2";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "Micro Empresa", 
    price: 0, 
    durationDays: 30, 
    active: true,
    type: "SEMESTRAL",
    category: "PAGO",
    maxEntidades: 1,
    maxUtilizadores: 1
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Planos | Salya Admin";
  }, []);

  const fetchPlans = () => {
    apiGet("/admin/plans")
      .then(res => res.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
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
      confirmButtonColor: "#4f46e5",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const openModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ 
        name: plan.name, 
        price: plan.price, 
        durationDays: plan.durationDays, 
        active: plan.active,
        type: plan.type || "SEMESTRAL",
        category: plan.category || "PAGO",
        maxEntidades: plan.maxEntidades || 1,
        maxUtilizadores: plan.maxUtilizadores || 1
      });
    } else {
      setEditingPlan(null);
      setFormData({ 
        name: "", 
        price: 0, 
        durationDays: 30, 
        active: true,
        type: "SEMESTRAL",
        category: "PAGO",
        maxEntidades: 1,
        maxUtilizadores: 1
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planos de Subscrição</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all relative overflow-hidden ${
              plan.type === 'DEMO' ? 'border-emerald-200/80' : 
              plan.type === 'CORPORATIVO' ? 'border-purple-200/80' : 'border-slate-200/80'
            }`}
          >
            {/* Top Row */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.type === 'DEMO' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' :
                  plan.type === 'CORPORATIVO' ? 'bg-purple-50 border border-purple-100 text-purple-600' :
                  'bg-indigo-50 border border-indigo-100 text-indigo-600'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openModal(plan)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    title="Editar Plano"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                    title="Excluir Plano"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 ${
                  plan.type === 'DEMO' ? 'bg-emerald-100/70 text-emerald-700' :
                  plan.type === 'CORPORATIVO' ? 'bg-purple-100/70 text-purple-700' :
                  plan.type === 'ANUAL' ? 'bg-blue-100/70 text-blue-700' :
                  'bg-indigo-100/70 text-indigo-700'
                }`}>{plan.type}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-3">{plan.name}</h3>
              
              {/* Pricing Block */}
              <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                {plan.type === 'DEMO' ? (
                  <div>
                    <span className="text-2xl font-black text-emerald-600">Gratuito</span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5">Período de avaliação</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(plan.price)}</span>
                      <span className="text-xs text-slate-400 font-medium">/ {plan.durationDays} dias</span>
                    </div>
                    {/* Monthly & Annual breakdown */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200/50 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-medium">Mensal est.</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(Math.round(plan.price / (plan.durationDays / 30)))}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block font-medium">Anual est.</span>
                        <span className="font-bold text-slate-700">{formatCurrency(Math.round(plan.price / (plan.durationDays / 30) * 12))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{plan.maxEntidades || 1} Entidade(s)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{plan.maxUtilizadores >= 999 ? 'Utilizadores Ilimitados' : `${plan.maxUtilizadores || 1} Utilizador(es)`}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Validade de {plan.durationDays} dias</span>
                </div>
                {(plan.maxFuncionarios || plan.maxColaboradores) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Até {plan.maxFuncionarios || plan.maxColaboradores} Colaboradores</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                plan.active ? "bg-emerald-100/70 text-emerald-800" : "bg-slate-200/70 text-slate-700"
              }`}>
                {plan.active ? "Disponível" : "Indisponível"}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">ID: {plan.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeModal} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPlan ? "Atualizar Plano" : "Criar Novo Plano"}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nome do Plano</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Micro Empresa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="DEMO">DEMO</option>
                    <option value="SEMESTRAL">SEMESTRAL</option>
                    <option value="ANUAL">ANUAL</option>
                    <option value="CORPORATIVO">CORPORATIVO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Preço (Kz)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Duração (Dias)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Utilizadores</label>
                  <input 
                    type="number" 
                    required
                    value={formData.maxUtilizadores}
                    onChange={e => setFormData({ ...formData, maxUtilizadores: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-700">Plano Ativo</span>
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs"
              >
                {isLoading ? "A guardar..." : "Guardar Plano"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
