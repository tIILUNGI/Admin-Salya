import { useState, FormEvent } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Eye, EyeOff, Wallet } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token);
        navigate("/");
      } else {
        setError(data.message || "Credenciais inválidas");
      }
    } catch (err) {
      setError("Erro no servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex min-h-[600px]"
      >
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col items-center justify-center bg-primary-500 text-white w-1/2 p-12 text-center lg:p-20">
          <div className="mb-8">
             <Wallet className="w-20 h-20 text-white mb-6" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">SALYA</h1>
          <p className="text-lg opacity-90 font-medium">Sistema de Gestão de Recibo Salarial</p>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white w-full md:w-1/2">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo</h2>
            <p className="text-slate-500 font-medium tracking-tight">Entre na sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3.5 px-4 outline-none focus:border-primary-500 transition-all font-medium text-slate-900"
                  placeholder="admin@salya.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Palavra-passe</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3.5 px-4 pr-12 outline-none focus:border-primary-500 transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-sm font-bold border border-rose-100 italic">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <button className="text-primary-500 text-sm font-bold hover:underline block w-full">
              Esqueceu a palavra-passe?
            </button>
            <p className="text-sm text-slate-500 font-medium">
              Não tem conta? <button className="text-primary-500 font-bold hover:underline">Criar conta</button>
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
            <button className="text-slate-400 text-sm font-medium hover:text-slate-600 flex items-center gap-2">
              <span className="text-lg">←</span> Voltar à página inicial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
