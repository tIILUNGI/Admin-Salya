import { useEffect, useState, useCallback } from "react";
import { Ticket, Users, CalendarCheck, ToggleLeft, ToggleRight, Plus, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiGet, apiPost, apiPut } from "../lib/api";

interface VoucherRedemption {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  voucherCode: string;
  redeemedAt: string;
  expiresAt: string;
  grantPlanType: string;
}

interface Voucher {
  id: number;
  code: string;
  description: string;
  durationDays: number;
  active: boolean;
  maxUses: number | null;
  currentUses: number;
  expiryDate: string | null;
  createdAt: string;
}

interface Summary {
  totalRedemptions: number;
  salya60dRedemptions: number;
  vouchers: Voucher[];
  redemptions: VoucherRedemption[];
}

function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysLeft(expiresAt);
  if (days <= 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
        <XCircle className="w-3 h-3" /> Expirado
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" /> {days}d restantes
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3" /> {days}d restantes
    </span>
  );
}

export default function Vouchers() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDays, setNewDays] = useState("60");
  const [newMax, setNewMax] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/vouchers/admin/summary");
      const data = await res.json();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (voucher: Voucher) => {
    try {
      await apiPut(`/vouchers/admin/${voucher.id}/toggle`, {});
      await load();
    } catch { /* silent */ }
  };

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    setCreateMsg("");
    try {
      const res = await apiPost("/vouchers/admin/create", {
        code: newCode.trim().toUpperCase(),
        durationDays: parseInt(newDays) || 60,
        maxUses: newMax ? parseInt(newMax) : null,
      });
      if (res.ok) {
        setCreateMsg("✅ Voucher criado com sucesso!");
        setNewCode(""); setNewDays("60"); setNewMax("");
        await load();
        setTimeout(() => { setShowCreate(false); setCreateMsg(""); }, 1500);
      } else {
        const err = await res.json();
        setCreateMsg("❌ " + (err.error || "Erro ao criar voucher."));
      }
    } catch {
      setCreateMsg("❌ Erro de ligação ao servidor.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = (summary?.redemptions || []).filter(r =>
    r.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    r.userName?.toLowerCase().includes(search.toLowerCase()) ||
    r.voucherCode?.toLowerCase().includes(search.toLowerCase())
  );

  const expired = (summary?.redemptions || []).filter(r => daysLeft(r.expiresAt) <= 0).length;
  const active  = (summary?.redemptions || []).filter(r => daysLeft(r.expiresAt) > 0).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-700" />
            Gestão de Vouchers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitorize ativações, dias restantes e controle os códigos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Atualizar" className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Voucher
          </button>
        </div>
      </div>

      {/* Criar Voucher */}
      {showCreate && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black text-purple-900">Criar Novo Código de Voucher</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ex: SALYA30D"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duração (dias)</label>
              <input
                type="number"
                value={newDays}
                onChange={e => setNewDays(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Usos Máx. (vazio = ilimitado)</label>
              <input
                type="number"
                value={newMax}
                onChange={e => setNewMax(e.target.value)}
                placeholder="Ilimitado"
                className="w-full px-3 py-2 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          {createMsg && <p className="text-xs font-semibold text-slate-700">{createMsg}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newCode.trim()}
              className="px-5 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 disabled:opacity-50 transition-all"
            >
              {creating ? "A criar..." : "Criar Voucher"}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Ativações", value: summary?.totalRedemptions ?? "—", icon: Ticket, color: "purple" },
          { label: "SALYA60D Usados", value: summary?.salya60dRedemptions ?? "—", icon: CheckCircle, color: "indigo" },
          { label: "Contas Activas", value: loading ? "—" : active, icon: Users, color: "emerald" },
          { label: "Contas Expiradas", value: loading ? "—" : expired, icon: CalendarCheck, color: "rose" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          const colors: Record<string, string> = {
            purple: "bg-purple-50 text-purple-700 border-purple-100",
            indigo:  "bg-indigo-50 text-indigo-700 border-indigo-100",
            emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
            rose:    "bg-rose-50 text-rose-700 border-rose-100",
          };
          return (
            <div key={i} className={`p-4 rounded-2xl border ${colors[kpi.color]} flex items-center gap-3`}>
              <Icon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-2xl font-black leading-none">{kpi.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vouchers cadastrados */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-800">Códigos de Voucher</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {(summary?.vouchers || []).map(v => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-xl flex items-center justify-center ${v.active ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-400"}`}>
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 font-mono">{v.code}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{v.durationDays} dias · {v.currentUses} uso(s){v.maxUses ? ` / ${v.maxUses} máx.` : " · Ilimitado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${v.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {v.active ? "Activo" : "Inactivo"}
                </span>
                <button
                  onClick={() => handleToggle(v)}
                  title={v.active ? "Desactivar voucher" : "Activar voucher"}
                  className="text-slate-400 hover:text-purple-700 transition-colors"
                >
                  {v.active
                    ? <ToggleRight className="w-6 h-6 text-purple-700" />
                    : <ToggleLeft className="w-6 h-6" />
                  }
                </button>
              </div>
            </div>
          ))}
          {!loading && !summary?.vouchers?.length && (
            <p className="px-5 py-6 text-xs text-slate-400 text-center">Nenhum voucher criado.</p>
          )}
        </div>
      </div>

      {/* Tabela de Ativações */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-800">Histórico de Ativações</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por e-mail, nome ou código..."
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400 w-64"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-700 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Nenhuma ativação encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Utilizador", "E-mail", "Código", "Ativado em", "Expira em", "Estado"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.userName || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">{r.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className="font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">{r.voucherCode}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.redeemedAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.expiresAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge expiresAt={r.expiresAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 text-[10px] text-slate-400 font-medium">
            {filtered.length} resultado(s) · {active} conta(s) ativas · {expired} expirada(s)
          </div>
        )}
      </div>
    </div>
  );
}
