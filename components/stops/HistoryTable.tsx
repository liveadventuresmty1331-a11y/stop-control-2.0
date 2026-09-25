"use client";

import { Eye, Wrench, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatDateTime, formatDurationMinutes } from "@/lib/utils";

export interface HistoryStopRecord {
  id: string;
  machineId: string;
  machine?: { code?: string; name?: string; status?: string; area?: { name?: string } };
  areaId: string;
  area?: { name?: string };
  processId: string;
  process?: { name?: string };
  stopTypeId: string;
  stopType?: { name?: string };
  causeId: string;
  cause?: { name?: string; isRepairable?: boolean };
  priorityId: string;
  priority?: { name?: string; colorCode?: string; level?: number };
  operatorId: string;
  operator?: { id?: string; name?: string; email?: string };
  technicianId?: string | null;
  technician?: { id?: string; name?: string; email?: string } | null;
  workOrder?: { id?: string; code?: string; status?: string; notes?: string | null } | null;
  shift?: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  actionTaken?: string | null;
  observations?: string | null;
  status: string;
}

interface HistoryTableProps {
  stops: HistoryStopRecord[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onViewDetail: (stop: HistoryStopRecord) => void;
}

export default function HistoryTable({
  stops,
  loading,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
}: HistoryTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Cargando historial de paros desde el servidor...</span>
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
        <Clock className="w-8 h-8 text-slate-600 mb-1" />
        <p className="font-semibold text-white text-sm">No se encontraron paros con los filtros actuales</p>
        <p className="text-slate-500 max-w-md">
          Pruebe limpiando los filtros aplicados o ampliando el rango de fechas de búsqueda.
        </p>
      </div>
    );
  }

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/90 text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Máquina</th>
                <th className="px-3.5 py-3 font-semibold">Área / Proceso</th>
                <th className="px-3.5 py-3 font-semibold">Causa / Tipo</th>
                <th className="px-3.5 py-3 font-semibold">Prioridad</th>
                <th className="px-3.5 py-3 font-semibold">Turno</th>
                <th className="px-3.5 py-3 font-semibold">Operador / Técnico</th>
                <th className="px-3.5 py-3 font-semibold">Inicio / Fin</th>
                <th className="px-3.5 py-3 font-semibold">Duración</th>
                <th className="px-3.5 py-3 font-semibold">Orden Trabajo</th>
                <th className="px-3.5 py-3 font-semibold">Estado</th>
                <th className="px-3.5 py-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {stops.map((stop) => {
                const isCompleted = stop.status === "COMPLETED";

                return (
                  <tr
                    key={stop.id}
                    className="hover:bg-slate-850/50 transition group cursor-pointer"
                    onClick={() => onViewDetail(stop)}
                  >
                    {/* Máquina */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-white text-xs block">
                        {stop.machine?.code || "-"}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">
                        {stop.machine?.name}
                      </span>
                    </td>

                    {/* Área / Proceso */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="text-slate-200 font-medium block">{stop.area?.name || "-"}</span>
                      <span className="text-[10.5px] text-slate-500 block">{stop.process?.name || "-"}</span>
                    </td>

                    {/* Causa / Tipo */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-200 block truncate max-w-[130px]">
                        {stop.cause?.name || "-"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {stop.stopType?.name || "No planeado"}
                      </span>
                    </td>

                    {/* Prioridad */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: stop.priority?.colorCode || "#ef4444" }}
                        />
                        <span className="font-semibold text-slate-200">{stop.priority?.name || "Normal"}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Nivel {stop.priority?.level || 1}</span>
                    </td>

                    {/* Turno */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="text-slate-300">{stop.shift || "Matutino"}</span>
                    </td>

                    {/* Operador / Técnico */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="text-slate-200 font-medium block truncate max-w-[130px]">
                        {stop.operator?.name || "Operador"}
                      </span>
                      {stop.technician ? (
                        <span className="text-[10.5px] text-sky-400 block truncate max-w-[130px]">
                          Téc: {stop.technician.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 block">Sin técnico asignado</span>
                      )}
                    </td>

                    {/* Inicio / Fin */}
                    <td className="px-3.5 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      <div>Ini: {formatDateTime(stop.startTime)}</div>
                      {stop.endTime ? (
                        <div className="text-slate-500">Fin: {formatDateTime(stop.endTime)}</div>
                      ) : (
                        <div className="text-rose-400 font-semibold animate-pulse">En curso</div>
                      )}
                    </td>

                    {/* Duración */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      {stop.duration !== null && stop.duration !== undefined ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-400 text-xs block">
                            {stop.duration} min
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {formatDurationMinutes(stop.duration)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-rose-400 text-xs">Activo</span>
                      )}
                    </td>

                    {/* Orden de Trabajo */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      {stop.workOrder ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 text-sky-300">
                          <Wrench className="w-3 h-3 text-sky-400" />
                          {stop.workOrder.code}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isCompleted
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800/60"
                          : "bg-rose-950 text-rose-300 border-rose-800/60 animate-pulse"
                      }`}>
                        {stop.status}
                      </span>
                    </td>

                    {/* Acción Ver Detalle */}
                    <td className="px-3.5 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onViewDetail(stop)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white transition"
                        title="Ver detalle completo de trazabilidad"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong className="text-white">{startRecord}</strong> - <strong className="text-white">{endRecord}</strong> de{" "}
            <strong className="text-white">{total}</strong> registros
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Controles de página */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-700 disabled:opacity-40 text-slate-300 transition text-xs font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <span className="px-3 py-1 font-mono font-bold text-slate-200 text-xs">
            Pág. {page} de {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-700 disabled:opacity-40 text-slate-300 transition text-xs font-semibold"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
