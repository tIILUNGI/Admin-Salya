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
  ChevronLeft,
  Mail
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navCategories = [
  {
    title: "Visão geral",
    items: [
      { path: "/", label: "Visão geral", icon: LayoutDashboard }
    ]
  },
  {
    title: "Gestão de clientes",
    items: [
      { path: "/companies", label: "Empresas", icon: Building2 },
      { path: "/subscriptions", label: "Subscrições", icon: History },
      { path: "/plans", label: "Planos", icon: Package },
      { path: "/users", label: "Utilizadores", icon: Users },
      { path: "/payments", label: "Pagamentos", icon: CreditCard }
    ]
  },
  {
    title: "Operação",
    items: [
      { path: "/leads", label: "Leads Folha", icon: Mail },
      { path: "/logs", label: "Auditoria & Logs", icon: ShieldCheck }
    ]
  }
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
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white text-slate-700 flex flex-col border-r border-slate-200/80 transition-all duration-300 h-screen overflow-y-auto overflow-x-visible shadow-xs select-none",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:z-30"
      )}>
        {/* Logo & Header */}
        <div className={cn(
          "p-4 border-b border-slate-100 shrink-0 flex items-center justify-between relative bg-white min-h-[64px]",
          isCollapsed && "px-2 justify-center"
        )}>
          <Link to="/" className={cn("flex items-center gap-2.5", isCollapsed && "justify-center w-full")}>
            <div className={cn(
              "bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-center transition-all shadow-2xs shrink-0",
              isCollapsed ? "size-10" : "h-9 px-2"
            )}>
              <img 
                src="/logo.png" 
                alt="Salya Logo" 
                className="h-6 w-auto object-contain shrink-0" 
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-900 tracking-tight leading-none">SALYA</span>
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase leading-tight mt-0.5">
                  Painel Admin
                </span>
              </div>
            )}
          </Link>
          
          {/* Enhanced Toggle Button */}
          <button 
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            className="hidden lg:flex absolute -right-3.5 top-5.5 size-7 bg-white hover:bg-indigo-600 text-slate-500 hover:text-white border-2 border-slate-200 hover:border-indigo-600 rounded-full items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-95 z-50 cursor-pointer group"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Navigation by Categories */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-visible scrollbar-thin">
          {navCategories.map((category, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed ? (
                <h3 className="px-3 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                  {category.title}
                </h3>
              ) : (
                idx > 0 && <div className="border-t border-slate-100 my-2 mx-2" />
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group relative",
                          isCollapsed ? "justify-center px-2 py-3" : "justify-between",
                          isActive
                            ? "bg-indigo-50/90 text-indigo-700 font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
                          )}
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              "w-4.5 h-4.5 transition-all shrink-0",
                              isActive ? "text-indigo-600 scale-105" : "text-slate-400 group-hover:text-slate-700 group-hover:scale-105"
                            )} />
                            {!isCollapsed && <span>{item.label}</span>}
                          </div>

                          {/* Floating Tooltip for Collapsed Sidebar */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none flex items-center gap-1.5 border border-slate-700">
                              <span>{item.label}</span>
                              {isActive && <span className="size-1.5 rounded-full bg-indigo-400" />}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-2 bg-slate-50/50">
          <Link
            to="/profile"
            onClick={closeMobileMenu}
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-white hover:bg-indigo-50/60 transition-all border border-slate-200/70 shadow-2xs group relative",
              isCollapsed && "justify-center px-1.5 py-2"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ring-2 ring-indigo-500/20">
              {admin ? admin.name?.charAt(0)?.toUpperCase() || "A" : "A"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-xs font-bold truncate">
                    {admin?.name || "Administrador"}
                  </p>
                  <p className="text-slate-400 text-[10px] truncate">
                    {admin?.email || "admin@salya.ao"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
              </>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-slate-700">
                <p className="font-bold">{admin?.name || "Administrador"}</p>
                <p className="text-[10px] text-slate-300 font-normal">{admin?.email || "admin@salya.ao"}</p>
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 w-full text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-all border border-transparent hover:border-rose-100 group relative",
              isCollapsed && "justify-center px-1.5"
            )}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 text-rose-500 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span>Terminar sessão</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-slate-700">
                Terminar sessão
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
