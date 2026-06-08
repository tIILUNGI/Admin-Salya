import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Eye, EyeOff, Wallet, UserPlus, ArrowLeft } from "lucide-react";
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
    document.title = isRegistering ? "Criar Conta" : "Salya Admin";

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
        // Verificar se o utilizador tem papel de administrador
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
          text: "Login realizado com sucesso",
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
          ? "Conta criada! Seu plano Demo está ativo por 24 horas."
          : "Conta criada! Aguarde a autorização do admin para acessar o sistema.";

        Swal.fire({
          icon: "success",
          title: "Conta Criada!",
          text: message,
          confirmButtonColor: "#2563eb"
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

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: "Recuperar Senha",
      text: "Digite seu email para receber o link de recuperação",
      input: "email",
      inputLabel: "Email",
      inputPlaceholder: "seu@email.com",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280"
    });

    if (email) {
      Swal.fire({
        icon: "success",
        title: "Email Enviado!",
        text: "Verifique sua caixa de entrada para redefinir sua senha",
        confirmButtonColor: "#2563eb"
      });
    }
  };

  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);

  if (isRegistering) {
    if (registrationStep === "choosePlan") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <button
                  onClick={() => setIsRegistering(false)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>

<div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Escolha o seu plano</h2>
          <p className="text-slate-500 mt-2">Selecione o plano de inscrição antes de preencher o cadastro.</p>
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
                      className="rounded-3xl border border-slate-200 p-6 text-left hover:border-primary-500 transition-colors bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-slate-900">{plan.name}</span>
                        <span className="text-sm text-slate-500">{plan.type}</span>
                      </div>
                      <p className="text-slate-600 mb-4">{plan.price ? `Kz ${plan.price}` : "Gratuito"}</p>
                      <p className="text-sm text-slate-500">{plan.durationDays} dia{plan.durationDays === 1 ? "" : "s"} de validade</p>
                      <div className="mt-6 rounded-2xl bg-white p-3 border border-slate-200 text-sm text-slate-700">
                        {plan.type === "DEMO"
                          ? "Demo ativo imediatamente por 24h."
                          : "Necessita autorização do admin após o cadastro."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <button
                onClick={() => setRegistrationStep("choosePlan")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para escolha de plano
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Criar Conta</h2>
                <p className="text-slate-500 mt-2">Cadastre-se com o plano selecionado.</p>
                {selectedPlan && (
                  <p className="mt-2 text-sm text-slate-500">
                    Plano selecionado: <strong>{selectedPlan.name}</strong> ({selectedPlan.type})
                  </p>
                )}
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900"
                    placeholder="João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900"
                    placeholder="joao@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900 pr-12"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900 pr-12"
                      placeholder="Confirme a senha"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  {isLoading ? "Criando Conta..." : "Criar Conta"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex min-h-[600px]"
      >
        <div className="hidden md:flex flex-col items-center justify-center bg-primary-500 text-white w-1/2 p-12 text-center lg:p-20">
          <div className="mb-8">
            <Wallet className="w-20 h-20 text-white mb-6" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">SALYA ADMIN</h1>
          <p className="text-lg opacity-90 font-medium">Salya Admin - Painel Administrativo</p>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white w-full md:w-1/2">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">Bem-vindo</h2>
            <p className="text-slate-500 font-medium tracking-tight">Entre na sua conta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900"
                  placeholder="admin@salya.com"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900 pr-12"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
            <div className="text-center">
              <button
                onClick={() => setIsRegistering(true)}
                className="text-primary-600 hover:text-primary-700 font-bold flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Não tem conta? Criar conta
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <Lock className="w-4 h-4" />
                Esqueceu a palavra-passe?
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
