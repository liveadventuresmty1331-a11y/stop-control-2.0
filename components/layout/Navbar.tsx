"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, User as UserIcon, Activity, PlusCircle, Layers, LayoutDashboard, History } from "lucide-react";
import { SessionUser } from "@/lib/auth";

interface NavbarProps {
  user: SessionUser;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ADMINISTRADOR: { bg: "bg-purple-950/50", text: "text-purple-400", border: "border-purple-800/40" },
  OPERADOR: { bg: "bg-amber-950/50", text: "text-amber-400", border: "border-amber-800/40" },
  SUPERVISOR: { bg: "bg-blue-950/50", text: "text-blue-400", border: "border-blue-800/40" },
  MANTENIMIENTO: { bg: "bg-emerald-950/50", text: "text-emerald-400", border: "border-emerald-800/40" },
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      // Manejo silencioso de error de red
    }
  };

  const style = ROLE_STYLES[user.role] || {
    bg: "bg-slate-800/50",
    text: "text-slate-300",
    border: "border-slate-700",
  };

  const canRegister = user.role === "ADMINISTRADOR" || user.role === "OPERADOR";
  const canSeeCatalogs = user.role === "ADMINISTRADOR";
  const canSeeDashboard = user.role === "ADMINISTRADOR" || user.role === "SUPERVISOR";

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Nav Links */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-base text-white shadow-md shadow-rose-900/30 group-hover:bg-rose-500 transition">
              ST
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">STOPControl</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-1 py-0.2 rounded border border-rose-500/30">
                  2.0
                </span>
              </div>
            </div>
          </Link>

          {/* Menú de Navegación Principal */}
          <nav className="flex items-center gap-1 text-xs">
            {canSeeDashboard && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  pathname === "/dashboard"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            <Link
              href="/active-stops"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                pathname === "/active-stops"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Paros Activos</span>
            </Link>

            {canRegister && (
              <Link
                href="/register-stop"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  pathname === "/register-stop"
                    ? "bg-rose-950/60 border border-rose-800 text-rose-300"
                    : "text-rose-400 hover:text-rose-300 hover:bg-slate-850"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Paro</span>
              </Link>
            )}

            {canSeeCatalogs && (
              <Link
                href="/catalogs"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  pathname === "/catalogs"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Catálogos</span>
              </Link>
            )}

            <Link
              href="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                pathname === "/history"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Historial</span>
            </Link>
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* User Info */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.2 rounded-lg border border-slate-800">
            <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <UserIcon className="w-3 h-3" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
            >
              {user.role}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
