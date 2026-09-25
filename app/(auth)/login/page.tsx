"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, Wrench } from "lucide-react";
import { DEMO_USERS } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Redirigir según el rol
      if (data.user.role === "OPERADOR") {
        router.push("/active-stops");
      } else {
        router.push(callbackUrl === "/login" ? "/dashboard" : callbackUrl);
      }
      router.refresh();
    } catch {
      setError("Error de red o conexión con el servidor");
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("demo123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header de la Aplicación */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-rose-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-rose-900/40 text-white">
            ST
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">STOPControl</h1>
            <span className="text-xs bg-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-500/30">
              2.0
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Control de Acceso y Monitoreo de Paros Industriales
          </p>
        </div>

        {/* Card del Formulario de Login */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Correo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Usuario / Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="operador@stopcontrol.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-rose-900/30"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Selector de Acceso Rápido Demo (Académico) */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Acceso Rápido Demo (1-Click)
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => {
                const isSelected = email === u.email;
                return (
                  <button
                    key={u.role}
                    type="button"
                    onClick={() => handleQuickFill(u.email)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                      isSelected
                        ? "bg-rose-950/40 border-rose-600/60"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200">{u.role}</span>
                    <span className="text-[11px] text-slate-400 truncate">{u.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Contraseña de entorno académico precargada automáticamente.
            </p>
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Wrench className="w-3.5 h-3.5" />
          <span>STOPControl 2.0 • Autenticación segura JWT & Cookies HttpOnly</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Cargando formulario de acceso...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
