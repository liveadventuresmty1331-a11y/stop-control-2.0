"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Wrench,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  // Estado del modo: 'login' | 'recover'
  const [mode, setMode] = useState<"login" | "recover">("login");

  // Campos de Login
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState(searchParams.get("email") ? "demo123" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos de Recuperación de Contraseña
  const [recoverEmail, setRecoverEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRecoverPass, setShowRecoverPass] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverSuccess, setRecoverSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        setError(data.error || "Error al iniciar sesión. Verifica tus credenciales.");
        setLoading(false);
        return;
      }

      // Redirigir al Home para todos los perfiles
      router.push(callbackUrl === "/login" ? "/home" : callbackUrl);
      router.refresh();
    } catch {
      setError("Error de red o conexión con el servidor");
      setLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError(null);
    setRecoverSuccess(null);

    if (newPassword !== confirmPassword) {
      setRecoverError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    if (newPassword.length < 4) {
      setRecoverError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setRecoverLoading(true);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoverEmail,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRecoverError(data.error || "No se pudo actualizar la contraseña.");
        setRecoverLoading(false);
        return;
      }

      setRecoverSuccess(
        "Contraseña actualizada exitosamente y sincronizada en Google Sheets (Hoja Usuarios)."
      );
      // Pre-cargar el correo en el formulario de login para comodidad del usuario
      setEmail(recoverEmail);
      setPassword(newPassword);
      setRecoverLoading(false);
    } catch {
      setRecoverError("Error de comunicación con el servidor al intentar recuperar la contraseña.");
      setRecoverLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Fondo sutil: Marca de agua UIN */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/uin-logo.png"
          alt=""
          className="w-96 sm:w-[500px] max-w-[70vw] opacity-[0.035] object-contain filter brightness-150"
        />
      </div>


      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        {/* Header de la Aplicación */}
        <div className="flex flex-col items-center text-center gap-2">
          {/* Logo pequeño de la Universidad */}
          <div className="flex items-center justify-center mb-1">
            <img
              src="/uin-logo.png"
              alt="Universidad Interamericana del Norte"
              className="h-9 sm:h-10 w-auto object-contain filter drop-shadow"
            />
          </div>

          <div className="h-11 w-11 rounded-xl bg-rose-600 flex items-center justify-center font-black text-xl shadow-xl shadow-rose-900/40 text-white">
            ST
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">STOPControl</h1>
            <span className="text-xs bg-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-500/30">
              2.0
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Control de Acceso y Monitoreo de Paros Industriales
          </p>
        </div>

        {/* Card Principal */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur shadow-2xl">
          {mode === "login" ? (
            /* =================== FORMULARIO DE LOGIN INDIVIDUAL =================== */
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Acceso Individual al Sistema
                </span>
                <span className="text-[11px] text-slate-500">Credenciales por usuario</span>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Correo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="usuario@stopcontrol.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              {/* Input Contraseña */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recover");
                      setRecoverEmail(email);
                      setRecoverError(null);
                      setRecoverSuccess(null);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
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
                    Validando acceso...
                  </span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cuentas, contraseñas y hashes encriptados (bcrypt) respaldados en Google Sheets</span>
                </div>
              </div>
            </form>
          ) : (
            /* =================== RECUPERAR CONTRASEÑA =================== */
            <form onSubmit={handleRecoverSubmit} className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Recuperar Contraseña
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu correo individual de usuario y define tu nueva contraseña. Se actualizará en la base de datos y quedará respaldada con su hash encriptado (bcrypt) en Google Sheets.
              </p>

              {recoverError && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{recoverError}</span>
                </div>
              )}

              {recoverSuccess && (
                <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-medium">{recoverSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="mt-1 py-1 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded font-semibold text-center transition"
                  >
                    Ir a Iniciar Sesión con mi nueva contraseña →
                  </button>
                </div>
              )}

              {/* Correo para recuperar */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Correo Electrónico de la Cuenta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="usuario@stopcontrol.local"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRecoverPass ? "text" : "password"}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoverPass(!showRecoverPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showRecoverPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRecoverPass ? "text" : "password"}
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              {/* Botón de Guardar en Google Sheets y DB */}
              <button
                type="submit"
                disabled={recoverLoading}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-emerald-900/30"
              >
                {recoverLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Guardando en Google Sheets...
                  </span>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Actualizar y Guardar en Google Sheet (con Hash)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition text-center"
              >
                Cancelar y regresar al inicio de sesión
              </button>
            </form>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Wrench className="w-3.5 h-3.5" />
          <span>STOPControl 2.0 • Autenticación individual con respaldo en la nube</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Cargando formulario de acceso...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
