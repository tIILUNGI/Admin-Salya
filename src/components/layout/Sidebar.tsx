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

export default function Sidebar({ 
  isMobileOpen, 
  onCloseMobileMenu,
  isCollapsed = false,
  setIsCollapsed
}: { 
  isMobileOpen: boolean; 
  onCloseMobileMenu: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (v: boolean) => void;
}) {
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
        "fixed inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 h-screen overflow-y-auto overflow-x-hidden",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:z-30"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/60 shrink-0 flex items-center justify-between relative bg-slate-900">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Salya" className="w-10 h-10 rounded-lg object-contain" />
          </div>
          
          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            title={isCollapsed ? "Expandir" : "Recolher"}
            className="hidden lg:flex absolute -right-3 top-8 size-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white transition-colors shadow-sm z-10"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isCollapsed ? "" : "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                title={isCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 group",
                    isCollapsed ? "justify-center" : "justify-between",
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
                        "w-5 h-5 transition-colors shrink-0",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-primary-400"
                      )} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && isActive && (
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
        <div className="p-4 border-t border-slate-800/50 shrink-0 space-y-3">
          <Link
            to="/profile"
            onClick={closeMobileMenu}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all group border border-slate-800 hover:border-slate-700",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? (admin?.name || "Perfil") : ""}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {admin ? admin.name?.charAt(0)?.toUpperCase() || "A" : "A"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">
                    {admin?.name || "Carregando..."}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate">
                    Super Admin
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
              </>
            )}
          </Link>

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Terminar Sessão" : ""}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 w-full text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-all border border-transparent hover:border-rose-400/10",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Terminar Sessão</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
