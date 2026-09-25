"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, Wrench, AlertCircle } from "lucide-react";
import { MachineStatusItem } from "@/lib/dashboard-service";
import LiveStopTimer from "@/components/stops/LiveStopTimer";
import { MACHINE_STATUS_CONFIG } from "@/lib/constants";

interface MachineStatusGridProps {
  machines: MachineStatusItem[];
  canManageStops?: boolean;
}

export default function MachineStatusGrid({
  machines,
  canManageStops = true,
}: MachineStatusGridProps) {
  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">No se encontraron máquinas para los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            Estado de Máquinas en Planta
          </h2>
          <p className="text-xs text-slate-400">
            Monitoreo en tiempo real de disponibilidad y paros activos por máquina.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {machines.length} máquina{machines.length === 1 ? "" : "s"} monitoreada{machines.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {machines.map((machine) => {
          const isStopped = machine.status === "STOPPED";
          const isOperating = machine.status === "OPERATING";
          const isMaintenance = machine.status === "MAINTENANCE";
          const config = MACHINE_STATUS_CONFIG[machine.status] || MACHINE_STATUS_CONFIG.OPERATING;

          return (
            <div
              key={machine.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition relative overflow-hidden shadow-sm ${
                isStopped
                  ? "bg-slate-900/90 border-rose-600/80 ring-1 ring-rose-500/40"
                  : isMaintenance
                  ? "bg-slate-900/70 border-amber-800/60"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Top Accent Strip if stopped */}
              {isStopped && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse" />
              )}

              <div>
                {/* Header: Code, Area & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                      {machine.code}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-1 truncate">
                      {machine.areaName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${isStopped ? "animate-ping" : ""}`} />
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Machine Name */}
                <h3 className="text-sm font-semibold text-white truncate mb-3" title={machine.name}>
                  {machine.name}
                </h3>

                {/* Machine Details / Stopped Information */}
                {isStopped && machine.activeStop ? (
                  <div className="rounded-lg bg-rose-950/40 border border-rose-900/60 p-2.5 flex flex-col gap-2 mb-2">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-400">Tiempo detenido:</span>
                      <LiveStopTimer
                        startTime={machine.activeStop.startTime}
                        className="text-xs py-0.5 px-2"
                      />
                    </div>

                    <div className="space-y-1 text-[11px] border-t border-rose-900/40 pt-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Causa:</span>
                        <span className="font-semibold text-rose-300 truncate max-w-[130px]" title={machine.activeStop.causeName}>
                          {machine.activeStop.causeName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Prioridad:</span>
                        <span
                          className="font-bold text-[10px] uppercase px-1.5 py-0.2 rounded"
                          style={{
                            color: machine.activeStop.priorityColor || "#ef4444",
                            backgroundColor: `${machine.activeStop.priorityColor || "#ef4444"}20`,
                          }}
                        >
                          {machine.activeStop.priorityName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Operador:</span>
                        <span className="truncate max-w-[120px] text-slate-400" title={machine.activeStop.operatorName}>
                          {machine.activeStop.operatorName}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isOperating ? (
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-2 flex items-center gap-2 mb-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">En producción continua</span>
                  </div>
                ) : isMaintenance ? (
                  <div className="rounded-lg bg-amber-950/20 border border-amber-900/30 p-2 flex items-center gap-2 mb-2 text-xs text-amber-400">
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">En intervención técnica</span>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-2 flex items-center gap-2 mb-2 text-xs text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">Fuera de programación</span>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {machine.code}
                </span>

                {isStopped && canManageStops ? (
                  <Link
                    href="/active-stops"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    <span>Gestionar paro</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    {isOperating ? "Operativo" : "En espera"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
