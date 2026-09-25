import { getServerSession } from "@/lib/auth";
import { getCompletedStops } from "@/lib/stops-service";
import { History, Wrench } from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatDurationMinutes } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await getServerSession();
  const completedStops = await getCompletedStops(20);

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Historial de Eventos de Paro</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro y trazabilidad de eventos finalizados para {session?.role || "Usuario"}. Duraciones oficiales en minutos y órdenes de trabajo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/active-stops"
            className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-900/50 bg-rose-950/30 transition font-semibold"
          >
            Ver Paros Activos
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Tabla de Eventos Finalizados */}
      {completedStops.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 text-sm">
          No hay paros completados registrados aún.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Máquina</th>
                  <th className="px-4 py-3 font-semibold">Área / Proceso</th>
                  <th className="px-4 py-3 font-semibold">Causa</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Inicio / Fin</th>
                  <th className="px-4 py-3 font-semibold">Duración</th>
                  <th className="px-4 py-3 font-semibold">Acción Tomada</th>
                  <th className="px-4 py-3 font-semibold">Orden Trabajo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {completedStops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-slate-850/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                      {stop.machine?.code || "-"}
                      <span className="block font-sans text-[11px] font-normal text-slate-400">
                        {stop.machine?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-300">{stop.area?.name || "-"}</span>
                      <span className="block text-[10px] text-slate-500">{stop.process?.name || "-"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{stop.cause?.name || "-"}</span>
                      <span className="block text-[10px] text-slate-500">{stop.stopType?.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        {stop.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      <div>Ini: {formatDateTime(stop.startTime)}</div>
                      {stop.endTime && <div>Fin: {formatDateTime(stop.endTime)}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {stop.duration !== null && stop.duration !== undefined ? `${stop.duration} min` : "-"}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {formatDurationMinutes(stop.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px]">
                      <p className="line-clamp-2 italic text-[11px]">
                        {stop.actionTaken ? `"${stop.actionTaken}"` : "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {stop.workOrder ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/50 text-sky-400">
                          <Wrench className="w-3 h-3" />
                          {stop.workOrder.code}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
