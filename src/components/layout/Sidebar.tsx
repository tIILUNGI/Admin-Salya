import { NavLink, useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  History, 
  Settings, 
  LogOut,
  Package,
  ShieldCheck,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { useAuth } from "../../App";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/companies", label: "Empresas", icon: Building2 },
  { path: "/users", label: "Usuários", icon: Users },
  { path: "/subscriptions", label: "Subscrições", icon: History },
  { path: "/payments", label: "Pagamentos", icon: CreditCard },
  { path: "/plans", label: "Planos", icon: Package },
  { path: "/logs", label: "Logs", icon: ShieldCheck },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(setAdmin);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col border-r border-slate-800 italic-none">
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center font-black text-white shadow-[0_8px_20px_rgba(var(--primary-color-rgb),0.3)]">
          S
        </div>
        <span className="text-2xl font-black text-white tracking-tighter">Salya <span className="text-primary-400">Admin</span></span>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-primary-500 text-white shadow-[0_8px_16px_rgba(var(--primary-color-rgb),0.2)]" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-primary-400")} />
                  {item.label}
                </div>
                {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <Link 
          to="/profile"
          className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-800/50 hover:bg-slate-800 transition-all group mb-4 border border-slate-800"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 font-black group-hover:scale-105 transition-transform">
            {admin ? admin.name.charAt(0) : "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-bold truncate">{admin?.name || "Carregando..."}</p>
            <p className="text-slate-500 text-[10px] truncate uppercase font-black tracking-widest">{admin?.role || "Super Admin"}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 w-full text-[10px] font-black text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all uppercase tracking-[0.2em] border border-transparent hover:border-rose-400/10"
        >
          <LogOut className="w-4 h-4" />
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
}
