import React, { ReactNode, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationDropdown from "../NotificationDropdown";
import { motion, AnimatePresence } from "motion/react";
import { Menu } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
  <div className="flex min-h-screen bg-slate-50 font-sans">
    <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
    <div className="flex-1 flex flex-col min-h-screen min-w-0">
      <header className="h-16 lg:h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight uppercase hidden md:block">
            Centro de Comando
          </h1>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <NotificationDropdown />
        </div>
      </header>

      <main className="flex-1 w-full px-4 lg:px-8 py-4 lg:py-8 min-w-0">
          <div className="w-full min-w-0">

            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname + window.location.search}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}
