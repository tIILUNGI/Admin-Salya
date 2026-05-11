import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiGet, apiPatch, apiDelete } from "../lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  clearAll: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const res = await apiGet("/notificacoes");
      if (res.ok) {
        const data = await res.json();
        // Mapear campos do backend (titulo -> title, mensagem -> message, lido -> read, tipo -> type)
        const mapped: Notification[] = data.map((n: any) => ({
          id: n.id.toString(),
          title: n.titulo,
          message: n.mensagem,
          type: n.tipo.toLowerCase(),
          read: n.lido,
          createdAt: n.createdAt
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiPatch(`/notificacoes/${id}`, { lido: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPatch("/notificacoes/lidas", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  };

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    // Para notificações locais se necessário, mas o ideal é vir do backend
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearAll = () => {
    // Backend não tem "clear all" global ainda, apenas marcar como lida ou eliminar individualmente
    // Vamos apenas marcar como lida no frontend por enquanto ou implementar delete individual
    markAllAsRead();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      clearAll,
      refresh: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
