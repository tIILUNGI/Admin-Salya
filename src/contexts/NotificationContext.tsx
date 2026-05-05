import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Carregar notificações iniciais (mock)
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: "1",
        title: "Nova Subscrição",
        message: "A empresa Beta Solutions assinou o plano Enterprise",
        type: "success",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: "2",
        title: "Pagamento Pendente",
        message: "5 pagamentos aguardam confirmação",
        type: "warning",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: "3",
        title: "Alerta de Sistema",
        message: "Backup automático concluído com sucesso",
        type: "info",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: "4",
        title: "Erro na Integração",
        message: "Falha ao sincronizar dados do gateway de pagamento",
        type: "error",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ];
    setNotifications(initialNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      clearAll
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
