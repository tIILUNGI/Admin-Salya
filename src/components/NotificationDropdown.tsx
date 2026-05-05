import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle2, AlertTriangle, Info, AlertCircle, Trash2 } from "lucide-react";
import { useNotifications, Notification } from "../contexts/NotificationContext";
import { motion, AnimatePresence } from "motion/react";

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-emerald-100 bg-emerald-50 hover:bg-emerald-100";
      case "warning":
        return "border-amber-100 bg-amber-50 hover:bg-amber-100";
      case "error":
        return "border-rose-100 bg-rose-50 hover:bg-rose-100";
      default:
        return "border-blue-100 bg-blue-50 hover:bg-blue-100";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return "Agora mesmo";
      if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
      if (diffInMinutes < 1440) return `Há ${Math.floor(diffInMinutes / 60)} h`;
      return `Há ${Math.floor(diffInMinutes / 1440)} d`;
    } catch {
      return "Agora mesmo";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 md:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 group"
      >
        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-rose-500 rounded-full border-2 border-white shadow-lg shadow-rose-500/50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[80vh] md:max-h-96"
          >
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">
                  Notificações
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                  {unreadCount} não lidas
                </p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-1 md:gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] md:text-xs text-primary-600 hover:text-primary-700 font-bold px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="p-1 md:p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Limpar todas"
                  >
                    <Trash2 className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 md:max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 md:p-8 text-center">
                  <Bell className="w-10 md:w-12 h-10 md:h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "mx-2 md:mx-3 p-2 md:p-3 rounded-xl border transition-all cursor-pointer group",
                        notification.read ? "bg-white border-slate-100" : getTypeStyles(notification.type)
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 md:p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-xs text-slate-500 hover:text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-200/50 transition-colors"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
