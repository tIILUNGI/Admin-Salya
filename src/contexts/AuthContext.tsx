import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'CLIENT' | 'OPERATOR' | 'SUPERVISOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (fullName: string, email: string, phone: string) => Promise<boolean>;
  switchRoleForDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const defaultDemoUsers: UserProfile[] = [
  {
    id: 'p-client-1',
    user_id: 'u-client-1',
    full_name: 'António Agostinho Neto',
    email: 'cliente@elmasico.co.ao',
    phone: '+244 923 111 222',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'CLIENT',
    status: 'ACTIVE',
  },
  {
    id: 'p-operator-1',
    user_id: 'u-operator-1',
    full_name: 'Mateus Manuel (Operador)',
    email: 'operador@elmasico.co.ao',
    phone: '+244 912 333 444',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'OPERATOR',
    status: 'ACTIVE',
  },
  {
    id: 'p-supervisor-1',
    user_id: 'u-supervisor-1',
    full_name: 'Dra. Maria Esperança (Supervisor)',
    email: 'supervisor@elmasico.co.ao',
    phone: '+244 945 555 666',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
  },
  {
    id: 'p-admin-1',
    user_id: 'u-admin-1',
    full_name: 'Eng. Paulo Elmasico (Admin)',
    email: 'admin@elmasico.co.ao',
    phone: '+244 923 000 000',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('elmasico_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultDemoUsers[0];
      }
    }
    return defaultDemoUsers[0];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('elmasico_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('elmasico_user');
    }
  }, [user]);

  const login = async (email: string, requestedRole?: UserRole) => {
    setLoading(true);
    const matched = defaultDemoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser(matched);
    } else {
      setUser({
        id: `p-${Date.now()}`,
        user_id: `u-${Date.now()}`,
        full_name: email.split('@')[0].toUpperCase(),
        email,
        role: requestedRole || 'CLIENT',
        status: 'ACTIVE',
      });
    }
    setLoading(false);
    return true;
  };

  const register = async (fullName: string, email: string, phone: string) => {
    setLoading(true);
    const newUser: UserProfile = {
      id: `p-${Date.now()}`,
      user_id: `u-${Date.now()}`,
      full_name: fullName,
      email,
      phone,
      role: 'CLIENT',
      status: 'ACTIVE',
    };
    setUser(newUser);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRoleForDemo = (role: UserRole) => {
    const matched = defaultDemoUsers.find(u => u.role === role);
    if (matched) setUser(matched);
    else if (user) setUser({ ...user, role });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, switchRoleForDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
