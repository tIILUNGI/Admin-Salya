import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  History,
  LogOut,
  Package,
  ShieldCheck,
  ChevronRight,
  Wallet
} from "lucide-react";
import { useAuth } from "../../App";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { path: "/companies", label: "Empresas", icon: Building2, badge: null },
  { path: "/users", label: "Usuários", icon: Users, badge: null },
  { path: "/subscriptions", label: "Subscrições", icon: History, badge: "Novo" },
  { path: "/payments", label: "Pagamentos", icon: CreditCard, badge: null },
  { path: "/plans", label: "Planos", icon: Package, badge: null },
  { path: "/logs", label: "Logs", icon: ShieldCheck, badge: null },
];

export default function Sidebar({ isMobileOpen, onCloseMobileMenu }: { isMobileOpen: boolean; onCloseMobileMenu: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);

  const closeMobileMenu = onCloseMobileMenu;

  useEffect(() => {
    apiGet("/admin/profile")
      .then(res => res.json())
      .then(setAdmin)
      .catch(() => setAdmin(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static lg:z-auto"
      )}>
        <div className="p-6 pb-4 flex items-center gap-4 border-b border-slate-800/60">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-extrabold text-white tracking-tight leading-none">Salya</span>
            <span className="text-[10px] font-extrabold text-primary-300 uppercase tracking-[0.3em] mt-1">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 lg:px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    "enterprise-sidebar-item group flex items-center justify-between px-3 lg:px-4 py-3 text-[13px] font-bold rounded-xl transition-all duration-200 relative overflow-hidden",
                    isActive
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30 animate-shimmer"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 z-10">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-transform",
                        isActive ? "bg-white/20" : "group-hover:bg-slate-700/50"
                      )}>
                        <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "text-slate-400 group-hover:text-primary-400")} />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && isActive && (
                      <span className="z-10 px-2 py-0.5 bg-amber-400 text-amber-900 text-[8px] font-extrabold uppercase rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>


        <div className="p-4 mt-auto border-t border-slate-800/50">
          <Link
            to="/profile"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all group border border-slate-800 hover:border-slate-700 mb-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              {admin ? admin.name?.charAt(0)?.toUpperCase() || "A" : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">
                {admin?.name || "Carregando..."}
              </p>
              <p className="text-slate-500 text-[10px] truncate uppercase tracking-wider">
                {admin?.role || "Super Admin"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-[10px] font-black text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all uppercase tracking-[0.2em] border border-transparent hover:border-rose-400/10"
          >
            <LogOut className="w-4 h-4" />
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}