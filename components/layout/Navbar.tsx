"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }
  };

  const style = ROLE_STYLES[user.role] || {
    bg: "bg-slate-800/50",
    text: "text-slate-300",
    border: "border-slate-700",
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-rose-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-rose-900/30">
            ST
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">STOPControl</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Control Industrial de Paros</p>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
                {user.email}
              </span>
            </div>
            <span
              className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
            >
              {user.role}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
