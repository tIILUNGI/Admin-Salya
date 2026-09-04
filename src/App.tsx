import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, UserRole } from './contexts/AuthContext';
import {
  Shield,
  Search,
  ArrowRight,
  Bot,
  Car,
  Building2,
  Receipt,
  FileCheck,
  GraduationCap,
  Briefcase,
  Globe,
  CheckCircle2,
  Clock,
  Lock,
  Menu,
  X,
  User,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  Bell,
  LogOut,
  Plus,
  Send,
  Upload,
  CreditCard,
  Check,
  Power,
  BarChart3,
  ListOrdered,
  Sliders,
  Users,
  Radio,
  FileText,
  Save,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ENGINE & TYPES ---
interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  elmasicoFee: number;
  officialFee: number;
  days: number;
  integration: boolean;
  system?: string;
  docs: string[];
}

interface Process {
  id: string;
  number: string;
  serviceName: string;
  clientName: string;
  status: 'NEW' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW' | 'PAYMENT_PENDING' | 'SUBMITTED' | 'COMPLETED';
  date: string;
  fee: number;
}

const mockServices: Service[] = [
  {
    id: 'srv-1',
    name: 'Tratamento de Alvará Comercial',
    category: 'SILAC / Licenciamento',
    description: 'Tratamento completo e acompanhamento do processo de obtenção do Alvará Comercial no SILAC.',
    elmasicoFee: 25000,
    officialFee: 15000,
    days: 7,
    integration: true,
    system: 'SILAC',
    docs: ['BI do Sócio-Gerente', 'NIF da Empresa', 'Certidão de Registo Comercial']
  },
  {
    id: 'srv-2',
    name: 'Renovação da Carta de Condução',
    category: 'Viação e Trânsito',
    description: 'Agendamento, validação médica e recolha da carta de condução na DNT.',
    elmasicoFee: 15000,
    officialFee: 10000,
    days: 5,
    integration: true,
    system: 'DNT',
    docs: ['BI Válido', 'Atestado Médico para Condução', 'Foto Passe Recente']
  },
  {
    id: 'srv-3',
    name: 'Emissão / Renovação de Passaporte',
    category: 'SME (Emigração)',
    description: 'Assistência e agendamento de recolha de dados biométricos junto do SME.',
    elmasicoFee: 20000,
    officialFee: 30000,
    days: 10,
    integration: false,
    system: 'SME',
    docs: ['BI Válido', 'Fotografia Tipo Passe']
  },
  {
    id: 'srv-4',
    name: 'Constituição de Empresa no GUE',
    category: 'GUE (Guiché Único)',
    description: 'Elaboração de pacto social, reserva de nome e registo simplificado de empresa.',
    elmasicoFee: 50000,
    officialFee: 22000,
    days: 3,
    integration: false,
    system: 'GUE',
    docs: ['BI dos Sócios', 'Cartão de NIF']
  },
  {
    id: 'srv-5',
    name: 'Atribuição e Atualização de NIF',
    category: 'AGT (Tributária)',
    description: 'Tratamento de cadastro tributário e obtenção de certidão na AGT.',
    elmasicoFee: 10000,
    officialFee: 0,
    days: 2,
    integration: true,
    system: 'AGT',
    docs: ['Bilhete de Identidade']
  }
];

const mockProcesses: Process[] = [
  {
    id: 'p-1',
    number: 'EC-2026-000001',
    serviceName: 'Tratamento de Alvará Comercial',
    clientName: 'António Agostinho Neto',
    status: 'UNDER_REVIEW',
    date: '15/01/2026',
    fee: 25000
  },
  {
    id: 'p-2',
    number: 'EC-2026-000002',
    serviceName: 'Renovação da Carta de Condução',
    clientName: 'António Agostinho Neto',
    status: 'COMPLETED',
    date: '05/01/2026',
    fee: 15000
  }
];

// --- PROTECTED & ROLE ROUTES ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; allowed: UserRole[] }> = ({ children, allowed }) => {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) return <Navigate to="/client/dashboard" replace />;
  return <>{children}</>;
};

// --- PUBLIC LANDING PAGE ---
const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                ELMASICO <span className="text-orange-500">CONNECT</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">“Conectando você aos serviços.”</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link to="/" className="text-blue-400">Início</Link>
            <Link to="/services" className="hover:text-white">Catálogo de Serviços</Link>
            <a href="#como-funciona" className="hover:text-white">Como Funciona</a>
            <a href="#beneficios" className="hover:text-white">Vantagens</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'OPERATOR' ? '/operator/dashboard' : '/client/dashboard'}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-blue-600/30"
                >
                  Painel ({user.role})
                </Link>
                <button onClick={logout} className="text-xs text-slate-400 hover:text-white">Sair</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white text-sm font-bold px-4">Iniciar Sessão</Link>
                <Link to="/register" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl">Criar Conta</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-24 text-center px-4 relative">
        <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-800/60 rounded-full px-4 py-1.5 mb-6 text-xs font-bold text-blue-300">
          🇦🇴 Plataforma Inteligente de Serviços Digitais em Angola
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white max-w-4xl mx-auto leading-tight">
          Todos os serviços digitais <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">num só lugar.</span>
        </h1>
        <p className="mt-6 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Encontre o serviço que precisa, envie os seus documentos e receba orientação passo a passo através da nossa inteligência artificial.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <Link to="/services" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-sm flex items-center justify-center gap-2">
            Solicitar Serviço <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/client/ai" className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-8 py-4 rounded-xl text-sm flex items-center justify-center gap-2">
            <Bot className="w-5 h-5 text-orange-400" /> Falar com IA
          </Link>
        </div>
      </section>

      {/* Catalog Preview */}
      <section className="py-16 bg-slate-900/60 border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Serviços Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockServices.slice(0, 3).map(s => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-800/40 mb-3 inline-block">{s.category}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">{s.description}</p>
                </div>
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-sm font-black text-white">{s.elmasicoFee.toLocaleString('pt-AO')} Kz</span>
                  <Link to="/services" className="text-xs font-bold text-orange-400 flex items-center gap-1">Solicitar <ChevronRight className="w-3.5 h-3.5" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// --- LOGIN PAGE ---
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('cliente@elmasico.co.ao');
  const { login, switchRoleForDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
    Swal.fire({ icon: 'success', title: 'Sessão Iniciada!', timer: 1200, showConfirmButton: false });
    if (email.includes('admin')) navigate('/admin/dashboard');
    else if (email.includes('operador')) navigate('/operator/dashboard');
    else navigate('/client/dashboard');
  };

  const quickSwitch = (roleEmail: string, role: UserRole) => {
    setEmail(roleEmail);
    switchRoleForDemo(role);
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'OPERATOR') navigate('/operator/dashboard');
    else navigate('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-white mb-2">
            <Shield className="w-8 h-8 text-blue-500" />
            ELMASICO <span className="text-orange-500">CONNECT</span>
          </Link>
          <p className="text-xs text-slate-400">“Conectando você aos serviços.”</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Palavra-passe</label>
            <input type="password" defaultValue="••••••••" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
            Iniciar Sessão
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-400 text-center mb-3">Acesso Rápido para Demonstração:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => quickSwitch('cliente@elmasico.co.ao', 'CLIENT')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold">Cliente</button>
            <button onClick={() => quickSwitch('operador@elmasico.co.ao', 'OPERATOR')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold">Operador</button>
            <button onClick={() => quickSwitch('supervisor@elmasico.co.ao', 'SUPERVISOR')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold">Supervisor</button>
            <button onClick={() => quickSwitch('admin@elmasico.co.ao', 'ADMIN')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold">Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CLIENT DASHBOARD ---
const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-6">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-base font-black text-white">ELMASICO CONNECT</span>
          </Link>
          <nav className="space-y-1">
            <Link to="/client/dashboard" className="block px-4 py-3 bg-blue-600/20 text-blue-400 font-bold rounded-xl text-xs">Dashboard</Link>
            <Link to="/client/ai" className="block px-4 py-3 text-slate-400 hover:text-white font-bold rounded-xl text-xs">Assistente IA</Link>
            <Link to="/services" className="block px-4 py-3 text-slate-400 hover:text-white font-bold rounded-xl text-xs">Catálogo de Serviços</Link>
          </nav>
        </div>
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white">{user?.full_name}</span>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h1 className="text-2xl font-black text-white">Olá, {user?.full_name} 👋</h1>
          <p className="text-xs text-slate-400 mt-1">Bem-vindo à sua área do cliente ELMASICO CONNECT.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Processos Ativos</span>
            <span className="text-2xl font-black text-white">1</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Concluídos</span>
            <span className="text-2xl font-black text-emerald-400">1</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Documentos Pendentes</span>
            <span className="text-2xl font-black text-orange-400">0</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Seus Processos</h3>
          <div className="space-y-3">
            {mockProcesses.map(p => (
              <div key={p.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-400 block">{p.number}</span>
                  <span className="text-sm font-bold text-white">{p.serviceName}</span>
                </div>
                <span className="px-3 py-1 bg-blue-950 text-blue-400 text-xs font-bold rounded-full">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- MAIN APP ROUTER ---
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client/ai" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/operator/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/supervisor/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
