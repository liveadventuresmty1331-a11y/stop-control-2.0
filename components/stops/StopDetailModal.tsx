"use client";

import { 
  X, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck
} from "lucide-react";
import { formatDateTime, formatDurationMinutes } from "@/lib/utils";

interface StopDetailData {
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
  createdAt?: string;
}

interface StopDetailModalProps {
  stop: StopDetailData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StopDetailModal({
  stop,
  isOpen,
  onClose,
}: StopDetailModalProps) {
  if (!isOpen || !stop) return null;

  const isCompleted = stop.status === "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isCompleted 
                ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400" 
                : "bg-rose-950/60 border-rose-800/80 text-rose-400"
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Trazabilidad de Paro: <span className="font-mono text-emerald-400">{stop.machine?.code}</span>
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isCompleted 
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800/60" 
                    : "bg-rose-950 text-rose-300 border-rose-800/60 animate-pulse"
                }`}>
                  {stop.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {stop.machine?.name} • {stop.area?.name || "Área General"} • {stop.process?.name || "Proceso"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Identificadores y métricas clave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Duración Oficial</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {stop.duration !== null && stop.duration !== undefined ? `${stop.duration} min` : "En curso"}
              </span>
              {stop.duration !== null && stop.duration !== undefined && (
                <span className="text-[10px] text-slate-500 block">({formatDurationMinutes(stop.duration)})</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Turno</span>
              <span className="text-sm font-semibold text-slate-200">{stop.shift || "Matutino"}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Prioridad</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: stop.priority?.colorCode || "#3b82f6" }}
                />
                <span className="font-semibold text-slate-200">{stop.priority?.name || "Normal"}</span>
              </div>
              <span className="text-[10px] text-slate-500">Nivel {stop.priority?.level || 1}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Orden de Trabajo</span>
              {stop.workOrder ? (
                <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1 mt-0.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  {stop.workOrder.code}
                </span>
              ) : (
                <span className="text-slate-500 text-xs mt-0.5 block">Sin orden técnica</span>
              )}
            </div>
          </div>

          {/* Línea de Tiempo y Trazabilidad */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-4 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Cronología y Registro de Trazabilidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inicio */}
              <div className="flex items-start gap-2.5">
                <div className="h-6 w-6 rounded-full bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  1
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Apertura del Paro</span>
                  <p className="font-mono text-xs text-slate-200">{formatDateTime(stop.startTime)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Registrado por: <strong className="text-slate-300">{stop.operator?.name || "Operador"}</strong> ({stop.operator?.email})
                  </p>
                </div>
              </div>

              {/* Fin */}
              <div className="flex items-start gap-2.5">
                <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  2
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Finalización del Paro</span>
                  <p className="font-mono text-xs text-slate-200">
                    {stop.endTime ? formatDateTime(stop.endTime) : "Paro aún activo"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Técnico interviniente:{" "}
                    <strong className="text-slate-300">
                      {stop.technician?.name || "Atendido en piso por operador"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnóstico y Causas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Causa Raíz de Paro</span>
              <p className="font-semibold text-white text-xs">{stop.cause?.name || "No especificada"}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                <span>Tipo: {stop.stopType?.name || "No planeado"}</span>
                <span>•</span>
                <span className={stop.cause?.isRepairable ? "text-sky-400" : "text-slate-500"}>
                  {stop.cause?.isRepairable ? "Falla Reparable (MTTR)" : "No reparable"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">ID Único de Evento</span>
              <p className="font-mono text-xs text-slate-400 truncate">{stop.id}</p>
              <p className="text-[10px] text-slate-500 mt-1.5">Persistido en PostgreSQL / UUID oficial</p>
            </div>
          </div>

          {/* Observaciones iniciales */}
          {stop.observations && (
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                Observaciones Reportadas en Apertura:
              </span>
              <p className="italic text-slate-300 text-xs leading-relaxed">&ldquo;{stop.observations}&rdquo;</p>
            </div>
          )}

          {/* Acción tomada / Solución aplicada */}
          {stop.actionTaken && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Acción Correctiva / Trabajo Realizado en Cierre:
              </span>
              <p className="italic text-emerald-200 text-xs leading-relaxed">&ldquo;{stop.actionTaken}&rdquo;</p>
            </div>
          )}

          {/* Aviso de Inmutabilidad y Auditoría */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Registro histórico verificado e inmutable. No se admiten modificaciones retroactivas para preservar la integridad de auditoría industrial.
            </span>
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
