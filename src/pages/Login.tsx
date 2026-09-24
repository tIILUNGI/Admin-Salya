import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Eye, EyeOff, Wallet, UserPlus, ArrowLeft, Shield } from "lucide-react";
import { motion } from "motion/react";
import Swal from "sweetalert2";
import { apiGet, apiPost } from "../lib/api";

type Plan = {
  id: number;
  name: string;
  price?: number;
  durationDays: number;
  type: string;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<"choosePlan" | "form">("choosePlan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = isRegistering ? "Criar Conta | Salya Admin" : "Painel Administrativo | Salya Admin";

    if (isRegistering) {
      setRegistrationStep("choosePlan");
      setSelectedPlanId("");

      apiGet("/auth/plans")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setPlans(data);
          }
        })
        .catch((err) => console.error("Erro ao buscar planos:", err));
    }
  }, [isRegistering]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await apiPost("/auth/login", { email, password });
      const data = await res.json();

      if (res.ok && data.token) {
        if (data.user?.planType !== 'ADMIN') {
          setError("Acesso negado. Esta área é exclusiva para administradores.");
          Swal.fire({
            icon: "error",
            title: "Acesso Negado",
            text: "Esta área é exclusiva para administradores do sistema.",
            confirmButtonColor: "#ef4444"
          });
          return;
        }
        login(data.token);
        Swal.fire({
          icon: "success",
          title: "Bem-vindo!",
          text: "Sessão iniciada com sucesso",
          timer: 1500,
          showConfirmButton: false
        });
        navigate("/");
      } else {
        const errorMsg = data.error || data.message || "Credenciais inválidas";
        setError(errorMsg);
        Swal.fire({
          icon: "error",
          title: "Erro de Autenticação",
          text: errorMsg,
          confirmButtonColor: "#ef4444"
        });
      }
    } catch (err) {
      setError("Erro no servidor. Tente novamente.");
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Senhas não coincidem",
        text: "Por favor, verifique as senhas",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    if (registerData.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Senha Fraca",
        text: "A senha deve ter pelo menos 6 caracteres",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    if (!selectedPlanId) {
      Swal.fire({
        icon: "warning",
        title: "Plano Obrigatório",
        text: "Por favor, selecione um plano para continuar.",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiPost("/auth/register", {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        planId: Number(selectedPlanId)
      });

      if (res.ok) {
        const plan = plans.find((plan) => String(plan.id) === selectedPlanId);
        const message = plan?.type === "DEMO"
          ? "Conta criada! Seu plano Demo está ativo por 30 dias."
          : "Conta criada! Aguarde a autorização do admin para acessar o sistema.";

        Swal.fire({
          icon: "success",
          title: "Conta Criada!",
          text: message,
          confirmButtonColor: "#4f46e5"
        });
        setIsRegistering(false);
        setRegistrationStep("choosePlan");
        setSelectedPlanId("");
        setRegisterData({ name: "", email: "", password: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.message || "Não foi possível criar a conta",
          confirmButtonColor: "#ef4444"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);

  const handleForgotPassword = async () => {
    const { value: forgotEmail } = await Swal.fire({
      title: "Recuperar Palavra-passe",
      text: "Insira o seu email de administrador para receber as instruções:",
      input: "email",
      inputValue: email,
      inputPlaceholder: "admin@salya.ao",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Enviar Instruções",
      cancelButtonText: "Cancelar",
      inputValidator: (val) => {
        if (!val || !val.includes("@")) {
          return "Por favor, insira um email válido!";
        }
      }
    });

    if (!forgotEmail) return;

    try {
      const res = await apiPost("/auth/forgot-password", { email: forgotEmail });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Email Enviado!",
          text: "Se o email estiver registado no sistema, receberá as instruções para redefinir a palavra-passe.",
          confirmButtonColor: "#4f46e5"
        });
      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.message || "Não foi possível enviar o email de recuperação.",
          confirmButtonColor: "#ef4444"
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Não foi possível conectar ao servidor",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  if (isRegistering) {
    if (registrationStep === "choosePlan") {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 border border-slate-100"
            >
              <button
                onClick={() => setIsRegistering(false)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Login
              </button>

              <div className="text-center mb-8">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl inline-block mb-3 shadow-2xs">
                  <img src="/logo.png" alt="Salya Logo" className="h-8 mx-auto object-contain" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Escolha o seu Plano</h2>
                <p className="text-xs text-slate-500 mt-1">Selecione uma opção para prosseguir.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(String(plan.id));
                      setRegistrationStep("form");
                    }}
                    className="rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-500 transition-all bg-slate-50/70 hover:bg-white text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{plan.type}</span>
                    </div>
                    <p className="font-extrabold text-indigo-600 text-base mb-2">{plan.price ? `Kz ${plan.price.toLocaleString()}` : "Gratuito"}</p>
                    <p className="text-slate-500">{plan.durationDays} dias de acesso</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-slate-100 text-xs"
          >
            <button
              onClick={() => setRegistrationStep("choosePlan")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à escolha de plano
            </button>

            <div className="text-center mb-6">
              <img src="/logo.png" alt="Salya Logo" className="h-9 mx-auto mb-3 object-contain" />
              <h2 className="text-lg font-bold text-slate-900">Criar Nova Conta</h2>
              {selectedPlan && (
                <p className="mt-1 text-slate-500">
                  Plano: <strong className="text-indigo-600">{selectedPlan.name}</strong>
                </p>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="exemplo@email.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Senha</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Confirmar Senha</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  placeholder="Confirme a senha"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isLoading ? "Criando..." : "Criar Conta"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800"
      >
        {/* Left Branding Box */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white md:w-1/2 p-8 sm:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[300px] md:min-h-[460px]">
          <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-white/20 mb-6 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Salya Logo" 
                className="h-12 w-auto object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">SALYA ADMIN</h1>
            <p className="text-xs text-indigo-200 max-w-xs font-medium leading-relaxed">
              Painel Corporativo de Gestão de Subscrições, Empresas e Auditoria
            </p>
          </div>

          <div className="relative z-10 text-[10px] text-indigo-300 font-medium tracking-wide">
            © Salya Payroll. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Form Box */}
        <div className="flex flex-col justify-center p-8 sm:p-12 bg-white md:w-1/2 text-xs">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold mb-3">
              <Shield className="w-3.5 h-3.5" /> Área Reservada
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
            <p className="text-slate-500 mt-1 font-medium">Introduza as suas credenciais de administrador.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Email Profissional</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 outline-none focus:bg-white focus:border-indigo-500 font-medium text-slate-900 transition-all"
                  placeholder="admin@salya.ao"
                />
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">Palavra-passe</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                >
                  Esqueceu a palavra-passe?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 outline-none focus:bg-white focus:border-indigo-500 font-medium text-slate-900 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isLoading ? "A Autenticar..." : "Iniciar Sessão"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
