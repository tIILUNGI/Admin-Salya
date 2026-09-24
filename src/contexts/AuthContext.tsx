import { createContext, useContext, useState, ReactNode } from "react";
import { apiPost } from "../lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("admin_token"));

  const login = (token: string) => {
    localStorage.setItem("admin_token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      apiPost("/auth/logout", {}).catch(() => {});
    }
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
