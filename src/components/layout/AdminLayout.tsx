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
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:pl-64">
        <header className="h-14 lg:h-16 bg-white border-b border-slate-200/60 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
              title="Menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <div className="lg:hidden font-black text-slate-900 tracking-tighter text-lg ml-1">SALYA</div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 ml-auto">
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5 lg:py-8 min-w-0 overflow-y-auto bg-slate-50/50">
          <div className="w-full min-w-0 max-w-[1440px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname + window.location.search}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
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
