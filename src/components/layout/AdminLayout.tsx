import React, { ReactNode, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationDropdown from "../NotificationDropdown";
import { Search, Menu } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirecionar para busca em empresas por padrão
      navigate(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg lg:text-xl font-black text-slate-900 uppercase tracking-tighter hidden md:block">
              Centro de Comando
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            {/* Global Search */}
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 lg:pr-16 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-40 lg:w-64 transition-all placeholder:text-slate-400"
              />
              <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                ↵
              </kbd>
            </form>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </header>

        <main className="-ml-1 lg:-ml-0 p-4 lg:p-8 flex-1">
          <div className="max-w-7xl mx-auto -ml-1 lg:-ml-0">

            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
