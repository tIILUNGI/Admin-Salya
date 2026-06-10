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
  ChevronRight
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
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 h-screen overflow-y-auto",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:z-30"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Salya" className="w-10 h-10 rounded-lg object-contain" />
            <span className="font-bold text-white text-sm hidden sm:inline">SALYA</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-primary-400"
                      )} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && isActive && (
                      <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/50 flex-shrink-0 space-y-3">
          <Link
            to="/profile"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all group border border-slate-800 hover:border-slate-700"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {admin ? admin.name?.charAt(0)?.toUpperCase() || "A" : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">
                {admin?.name || "Carregando..."}
              </p>
              <p className="text-slate-500 text-[10px] truncate">
                Super Admin
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-all border border-transparent hover:border-rose-400/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}
