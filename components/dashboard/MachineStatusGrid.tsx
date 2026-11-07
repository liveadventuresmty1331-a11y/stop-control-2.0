"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Wrench,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  Sparkles,
} from "lucide-react";
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
  // Control de colapso de la sección completa "Estado de Máquinas en Planta"
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);

  // Modo de vista: 'compact' (contraída por defecto según solicitud) o 'detailed' (expandida)
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");

  // Control individual de máquinas expandidas/contraídas (ID -> boolean)
  const [expandedMachines, setExpandedMachines] = useState<Record<string, boolean>>({});

  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">
          No se encontraron máquinas para los filtros seleccionados.
        </p>
      </div>
    );
  }

  // Contadores rápidos de estado
  const operatingCount = machines.filter((m) => m.status === "OPERATING").length;
  const stoppedCount = machines.filter((m) => m.status === "STOPPED").length;
  const maintenanceCount = machines.filter((m) => m.status === "MAINTENANCE").length;

  const toggleMachine = (id: string) => {
    setExpandedMachines((prev) => {
      const isCurrentlyExpanded =
        prev[id] !== undefined ? prev[id] : viewMode === "detailed";
      return {
        ...prev,
        [id]: !isCurrentlyExpanded,
      };
    });
  };

  const collapseAllMachines = () => {
    setViewMode("compact");
    const newExpanded: Record<string, boolean> = {};
    machines.forEach((m) => {
      newExpanded[m.id] = false;
    });
    setExpandedMachines(newExpanded);
  };

  const expandAllMachines = () => {
    setViewMode("detailed");
    const newExpanded: Record<string, boolean> = {};
    machines.forEach((m) => {
      newExpanded[m.id] = true;
    });
    setExpandedMachines(newExpanded);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-xl">
      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL: ESTADO DE MÁQUINAS EN PLANTA                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Estado de Máquinas en Planta</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {machines.length} equipos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Monitoreo en tiempo real de disponibilidad operativa y paros activos
            </p>
          </div>
        </div>

        {/* Controles de Vista y Colapso */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Resumen rápido de estados */}
          <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {operatingCount}
            </span>
            <span className="text-slate-600">/</span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {stoppedCount}
            </span>
            {maintenanceCount > 0 && (
              <>
                <span className="text-slate-600">/</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {maintenanceCount}
                </span>
              </>
            )}
          </div>

          {/* Botones de Contraer / Expandir Máquinas */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={collapseAllMachines}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition ${
                viewMode === "compact"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Contraer todas las máquinas (Vista Compacta)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Contraer</span>
            </button>

            <button
              type="button"
              onClick={expandAllMachines}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition ${
                viewMode === "detailed"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Expandir todas las máquinas (Vista Detallada)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Expandir</span>
            </button>
          </div>

          {/* Botón para Contraer/Desplegar la sección completa */}
          <button
            type="button"
            onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
            title={
              isSectionCollapsed
                ? "Desplegar sección Estado de Máquinas"
                : "Contraer sección Estado de Máquinas"
            }
          >
            {isSectionCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Desplegar</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Minimizar Sección</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTENIDO: MÁQUINAS (CONTRAÍDAS / EXPANDIDAS)                             */}
      {/* ========================================================================= */}
      {!isSectionCollapsed ? (
        <div
          className={`grid gap-3.5 ${
            viewMode === "compact"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          }`}
        >
          {machines.map((machine) => {
            const isStopped = machine.status === "STOPPED";
            const isOperating = machine.status === "OPERATING";
            const isMaintenance = machine.status === "MAINTENANCE";
            const config =
              MACHINE_STATUS_CONFIG[machine.status] || MACHINE_STATUS_CONFIG.OPERATING;

            // Determinar si esta máquina en particular está expandida
            const isExpanded =
              expandedMachines[machine.id] !== undefined
                ? expandedMachines[machine.id]
                : viewMode === "detailed";

            return isExpanded ? (
              /* ========================================================================= */
              /* VISTA EXPANDIDA (DETALLADA) DE LA MÁQUINA                                 */
              /* ========================================================================= */
              <div
                key={machine.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all relative overflow-hidden shadow-sm ${
                  isStopped
                    ? "bg-slate-900/90 border-rose-600/80 ring-1 ring-rose-500/40"
                    : isMaintenance
                    ? "bg-slate-900/70 border-amber-800/60"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Acento rojo si está detenida */}
                {isStopped && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse" />
                )}

                <div>
                  {/* Fila superior: Código, Área, Estado y Botón de Contraer */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                        {machine.code}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1 truncate max-w-[120px]">
                        {machine.areaName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${
                            isStopped ? "animate-ping" : ""
                          }`}
                        />
                        {config.label}
                      </span>

                      {/* Botón individual para contraer la máquina */}
                      <button
                        type="button"
                        onClick={() => toggleMachine(machine.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Contraer máquina"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Nombre de la máquina */}
                  <h3
                    className="text-sm font-semibold text-white truncate mb-2.5"
                    title={machine.name}
                  >
                    {machine.name}
                  </h3>

                  {/* Panel de estado detallado */}
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
                          <span
                            className="font-semibold text-rose-300 truncate max-w-[130px]"
                            title={machine.activeStop.causeName}
                          >
                            {machine.activeStop.causeName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Prioridad:</span>
                          <span
                            className="font-bold text-[10px] uppercase px-1.5 py-0.2 rounded"
                            style={{
                              color: machine.activeStop.priorityColor || "#ef4444",
                              backgroundColor: `${
                                machine.activeStop.priorityColor || "#ef4444"
                              }20`,
                            }}
                          >
                            {machine.activeStop.priorityName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Operador:</span>
                          <span
                            className="truncate max-w-[120px] text-slate-400"
                            title={machine.activeStop.operatorName}
                          >
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

                {/* Pie de acción */}
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
                    <button
                      type="button"
                      onClick={() => toggleMachine(machine.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 transition"
                    >
                      Contraer
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* VISTA CONTRAÍDA (COMPACTA) DE LA MÁQUINA                                  */
              /* ========================================================================= */
              <div
                key={machine.id}
                className={`rounded-xl border p-3.5 flex items-center justify-between transition-all shadow-sm ${
                  isStopped
                    ? "bg-slate-900/90 border-rose-600/80 ring-1 ring-rose-500/40"
                    : isMaintenance
                    ? "bg-slate-900/70 border-amber-800/60"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Lado izquierdo: Código, Nombre y Área */}
                <div className="flex items-center gap-3 truncate mr-2">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 shrink-0">
                    {machine.code}
                  </span>

                  <div className="truncate">
                    <h3
                      className="text-xs font-bold text-white truncate hover:text-rose-300 transition cursor-pointer"
                      title={machine.name}
                      onClick={() => toggleMachine(machine.id)}
                    >
                      {machine.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {machine.areaName}
                    </span>
                  </div>
                </div>

                {/* Lado derecho: Estado compacto, Cronómetro si hay paro y Botón Desplegar */}
                <div className="flex items-center gap-2 shrink-0">
                  {isStopped && machine.activeStop ? (
                    <div className="flex items-center gap-1.5">
                      <LiveStopTimer
                        startTime={machine.activeStop.startTime}
                        className="text-[10px] py-0.5 px-2"
                      />
                      {canManageStops && (
                        <Link
                          href="/active-stops"
                          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                          title="Gestionar paro activo"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}
                      />
                      <span className="hidden sm:inline">{config.label}</span>
                    </span>
                  )}

                  {/* Botón para expandir los detalles de la máquina */}
                  <button
                    type="button"
                    onClick={() => toggleMachine(machine.id)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                    title="Desplegar detalles de la máquina"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA MINIMIZADA DE LA SECCIÓN COMPLETA                                  */
        /* ========================================================================= */
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-medium">
              Sección contraída: <strong>{machines.length} máquinas en planta</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-400">{operatingCount} operando</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{stoppedCount} detenidas</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSectionCollapsed(false)}
            className="text-xs text-rose-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Desplegar sección</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
