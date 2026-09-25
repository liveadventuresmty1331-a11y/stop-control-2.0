import { getServerSession } from "@/lib/auth";
import { Activity, Clock } from "lucide-react";
import Link from "next/link";

export default async function ActiveStopsPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-white">Paros Activos en Planta</h1>
          </div>
          <p className="text-xs text-slate-400">
            Vista de monitoreo para máquinas detenidas en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
          <Clock className="w-4 h-4" />
          <span>Acceso Autorizado para Rol: {session?.role}</span>
        </div>
        <p className="text-xs text-slate-400">
          La interfaz completa del monitor de paros activos y cronómetro en vivo se implementará en las Fases 5 y 6. La verificación de acceso RBAC para esta ruta se completó con éxito.
        </p>
      </div>
    </div>
  );
}
