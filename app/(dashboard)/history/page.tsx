import { getServerSession } from "@/lib/auth";
import { History, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white">Historial de Eventos</h1>
          </div>
          <p className="text-xs text-slate-400">
            Registro y trazabilidad de eventos de paro y mantenimientos.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Acceso Autorizado para Rol: {session?.role}</span>
        </div>
        <p className="text-xs text-slate-400">
          La tabla de historial con filtros multicriterio, ordenamiento dinámico y vista de detalle se implementará en la Fase 7.
        </p>
      </div>
    </div>
  );
}
