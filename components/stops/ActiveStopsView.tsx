"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  RefreshCw, 
  Plus, 
  Clock, 
  User as UserIcon, 
  AlertTriangle, 
  Flame, 
  CheckCircle2,
  Filter,
  CheckSquare,
  Wrench,
  FileCheck
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { formatDateTime, formatDurationMinutes } from "@/lib/utils";
import LiveStopTimer from "./LiveStopTimer";
import CloseStopModal from "./CloseStopModal";

export interface StopRecord {
  id: string;
  machineId: string;
  machine?: { code?: string; name?: string; status?: string };
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
  operator?: { name?: string; email?: string };
  technicianId?: string | null;
  technician?: { name?: string; email?: string } | null;
  workOrder?: { id: string; code: string; status: string } | null;
  shift?: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  actionTaken?: string | null;
  observations?: string | null;
  status: string;
}

interface ActiveStopsViewProps {
  user: SessionUser;
}

export default function ActiveStopsView({ user }: ActiveStopsViewProps) {
  const [stops, setStops] = useState<StopRecord[]>([]);
  const [recentlyClosed, setRecentlyClosed] = useState<StopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOwn, setFilterOwn] = useState(false);
  const [selectedStopForClose, setSelectedStopForClose] = useState<StopRecord | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    message: string;
    stop: StopRecord;
  } | null>(null);

  const fetchActiveStops = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterOwn ? "/api/stops/active?own=true" : "/api/stops/active";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStops(data);
      }
    } catch (e) {
      console.error("Error al cargar paros activos:", e);
    } finally {
      setLoading(false);
    }
  }, [filterOwn]);

  useEffect(() => {
    fetchActiveStops();
    // Sondeo periódico cada 15 segundos para monitoreo de planta
    const interval = setInterval(fetchActiveStops, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveStops]);

  const canRegister = user.role === "ADMINISTRADOR" || user.role === "OPERADOR";
  const canClose = 
    user.status === "ACTIVE" && 
    ["ADMINISTRADOR", "OPERADOR", "SUPERVISOR", "MANTENIMIENTO"].includes(user.role);

  const handleStopClosed = (closedStop: StopRecord) => {
    // Quitar de paros activos
    setStops((prev) => prev.filter((s) => s.id !== closedStop.id));
    // Agregar a paros recientemente completados
    setRecentlyClosed((prev) => [closedStop, ...prev]);

    setSuccessBanner({
      message: `Paro finalizado con éxito en máquina ${closedStop.machine?.code || ""}. La máquina ha retornado a estado OPERATING.`,
      stop: closedStop,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Notificación de éxito al cerrar un paro */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 shadow-lg text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{successBanner.message}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-300/90">
                <span>Duración calculada: <strong>{successBanner.stop.duration} min</strong> ({formatDurationMinutes(successBanner.stop.duration)})</span>
                <span>•</span>
                <span>Estado: <strong className="text-white">COMPLETED</strong></span>
                {successBanner.stop.workOrder && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-sky-300">
                      <Wrench className="w-3 h-3" />
                      OT: {successBanner.stop.workOrder.code}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 transition shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Barra de Título y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-xl font-bold text-white tracking-tight">Monitor de Paros Activos en Planta</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cronómetro en tiempo real sincronizado con el servidor UTC y control de cierre de eventos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user.role === "OPERADOR" && (
            <button
              onClick={() => setFilterOwn(!filterOwn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterOwn
                  ? "bg-rose-950/60 border-rose-600 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterOwn ? "Viendo solo mis paros" : "Ver solo mis paros"}</span>
            </button>
          )}

          <button
            onClick={fetchActiveStops}
            title="Refrescar lista"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canRegister && (
            <Link
              href="/register-stop"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Paro</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid de Paros Activos */}
      {stops.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Sin paros activos en este momento</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todas las máquinas registradas se encuentran en estado operativo 🟢. Cuando se registre una falla o parada, aparecerá inmediatamente en este panel con su cronómetro en vivo.
            </p>
          </div>
          {canRegister && (
            <Link
              href="/register-stop"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>Abrir un paro de máquina</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stops.map((stop) => (
            <div
              key={stop.id}
              className="rounded-xl border border-rose-900/40 bg-slate-900/60 p-5 flex flex-col justify-between gap-4 shadow-xl hover:border-rose-700/60 transition group"
            >
              {/* Encabezado del Paro: Código, Nombre y Cronómetro en Vivo */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400 font-black text-sm">
                    {stop.machine?.code?.slice(0, 3) || "STP"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {stop.machine?.code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                        {stop.machine?.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {stop.area?.name || "Área General"} • {stop.process?.name || "Proceso"}
                    </span>
                  </div>
                </div>

                {/* Cronómetro en Vivo (Fuente de verdad: startTime en UTC) */}
                <div className="flex flex-col items-end gap-1">
                  <LiveStopTimer startTime={stop.startTime} />
                  <span className="text-[9.5px] uppercase font-semibold text-rose-400 tracking-wider flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    Paro Activo
                  </span>
                </div>
              </div>

              {/* Detalles Técnicos: Causa y Prioridad */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Causa Raíz
                  </span>
                  <span className="font-semibold text-slate-200 truncate">{stop.cause?.name || "-"}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{stop.stopType?.name || "No planeado"}</span>
                    {stop.cause?.isRepairable && (
                      <span className="text-sky-400 font-mono text-[9px]">MTTR</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> Prioridad
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stop.priority?.colorCode || "#ef4444" }}
                    />
                    <span className="font-semibold text-slate-200">{stop.priority?.name || "Normal"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Nivel {stop.priority?.level || 1}</span>
                </div>
              </div>

              {/* Observaciones iniciales */}
              {stop.observations && (
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                    Observaciones Iniciales:
                  </span>
                  <p className="italic text-[11px] leading-relaxed text-slate-400">&ldquo;{stop.observations}&rdquo;</p>
                </div>
              )}

              {/* Pie de Tarjeta: Operador, Turno, Hora de inicio y Botón Cerrar Paro */}
              <div className="pt-3 border-t border-slate-850 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Operador:</span>
                    <strong className="text-slate-300">{stop.operator?.name || "Operador"}</strong>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{stop.shift || "Matutino"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400/90">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Inicio: {formatDateTime(stop.startTime)}</span>
                  </div>
                </div>

                {/* Botón Cerrar Paro */}
                {canClose && (
                  <button
                    onClick={() => setSelectedStopForClose(stop)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-[0.99]"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Cerrar Paro y Reactivar Máquina</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sección de Paros Recientemente Finalizados */}
      {recentlyClosed.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Paros Recientemente Finalizados (Fase 6)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyClosed.map((rc) => (
              <div
                key={rc.id}
                className="p-4 rounded-xl border border-emerald-900/50 bg-slate-900/40 flex flex-col gap-2.5 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{rc.machine?.code}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      COMPLETED
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {rc.duration} min ({formatDurationMinutes(rc.duration)})
                  </span>
                </div>

                <div className="text-slate-300 text-[11px]">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Acción Correctiva:</span>
                  <p className="line-clamp-2 italic">&ldquo;{rc.actionTaken}&rdquo;</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10.5px] text-slate-400">
                  <span>Máquina: <strong className="text-emerald-400">OPERATING</strong></span>
                  {rc.workOrder && (
                    <span className="font-mono text-sky-400">OT: {rc.workOrder.code}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Cierre */}
      {selectedStopForClose && (
        <CloseStopModal
          stop={selectedStopForClose}
          isOpen={Boolean(selectedStopForClose)}
          onClose={() => setSelectedStopForClose(null)}
          onSuccess={handleStopClosed}
        />
      )}
    </div>
  );
}
