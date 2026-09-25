"use client";

import { BarChart3, AlertTriangle, Layers, Calendar } from "lucide-react";
import { DashboardCharts as DashboardChartsType } from "@/lib/dashboard-service";
import { formatDurationMinutes } from "@/lib/utils";

interface DashboardChartsProps {
  charts: DashboardChartsType;
}

export default function DashboardCharts({ charts }: DashboardChartsProps) {
  const { stopsByDay, stopsByPeriod, downtimeByMachine, stopsByCause } = charts;

  // Cálculo de máximos para escala visual en barras
  const maxDayMinutes = Math.max(...stopsByDay.map((d) => d.downtimeMinutes), 1);
  const maxMachineMinutes = Math.max(...downtimeByMachine.map((m) => m.downtimeMinutes), 1);
  const maxCauseCount = Math.max(...stopsByCause.map((c) => c.count), 1);
  const totalPeriodStops = stopsByPeriod.reduce((acc, p) => acc + p.count, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Paros y Tiempo de Paro por Día */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Paros y Tiempo por Día</h3>
              <p className="text-[11px] text-slate-400">Evolución diaria de minutos de paro y eventos</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {stopsByDay.length} día{stopsByDay.length === 1 ? "" : "s"} con datos
          </span>
        </div>

        {stopsByDay.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay paros completados en las fechas seleccionadas.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visualización de barras por día */}
            <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-1 border-b border-slate-800">
              {stopsByDay.map((d) => {
                const heightPercent = Math.max(8, Math.round((d.downtimeMinutes / maxDayMinutes) * 100));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip flotante */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-20">
                      <span className="font-bold">{d.label}:</span> {d.count} paro{d.count === 1 ? "" : "s"} ({formatDurationMinutes(d.downtimeMinutes)})
                    </div>

                    {/* Barra */}
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-rose-500 group-hover:to-rose-400 transition-all cursor-pointer relative"
                      >
                        {d.count > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-300">
                            {d.count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Label fecha */}
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
              <span>Altura de barra = Minutos de paro</span>
              <span>Número superior = Cantidad de eventos</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Tiempo de Paro por Máquina */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-950/50 border border-rose-800/40 text-rose-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Tiempo de Paro por Máquina</h3>
              <p className="text-[11px] text-slate-400">Distribución de minutos de inactividad acumulados</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Ranking de impacto</span>
        </div>

        {downtimeByMachine.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay paros registrados para las máquinas en este periodo.
          </div>
        ) : (
          <div className="space-y-2.5">
            {downtimeByMachine.slice(0, 5).map((m, idx) => {
              const widthPercent = Math.max(4, Math.round((m.downtimeMinutes / maxMachineMinutes) * 100));
              return (
                <div key={m.machineCode} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-slate-300 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {m.machineCode}
                      </span>
                      <span className="text-slate-300 truncate" title={m.machineName}>
                        {m.machineName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {m.count} evento{m.count === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono font-bold text-rose-400 min-w-[55px] text-right">
                        {formatDurationMinutes(m.downtimeMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/60">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className={`h-full rounded-full transition-all ${
                        idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-blue-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Frecuencia por Causa Raíz */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-950/50 border border-purple-800/40 text-purple-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Frecuencia por Causa Raíz</h3>
              <p className="text-[11px] text-slate-400">Incidencia y porcentaje de recurrencia por causa</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Incidencia</span>
        </div>

        {stopsByCause.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay paros registrados para las causas analizadas.
          </div>
        ) : (
          <div className="space-y-3">
            {stopsByCause.slice(0, 5).map((c, idx) => {
              const barPercent = Math.max(5, Math.round((c.count / maxCauseCount) * 100));
              return (
                <div key={c.causeName} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate" title={c.causeName}>
                      {c.causeName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-purple-300 font-bold">
                        {c.count} ({c.percentage}%)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDurationMinutes(c.downtimeMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/60">
                    <div
                      style={{ width: `${barPercent}%` }}
                      className={`h-full rounded-full transition-all ${
                        idx === 0 ? "bg-purple-500" : "bg-purple-600/70"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Distribución por Turno / Periodo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Distribución por Turno</h3>
              <p className="text-[11px] text-slate-400">Comparativa de paros y tiempo por turno operativo</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Turnos 1, 2 y 3</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {stopsByPeriod.map((p) => {
              const percent = totalPeriodStops > 0 ? Math.round((p.count / totalPeriodStops) * 100) : 0;
              return (
                <div
                  key={p.period}
                  className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 flex flex-col items-center text-center gap-1"
                >
                  <span className="text-xs font-semibold text-slate-300">{p.period}</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{p.count}</span>
                  <span className="text-[10px] text-slate-500">
                    {formatDurationMinutes(p.downtimeMinutes)} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden flex border border-slate-800">
            {stopsByPeriod.map((p, idx) => {
              const width = totalPeriodStops > 0 ? (p.count / totalPeriodStops) * 100 : 33.3;
              const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500"];
              return (
                <div
                  key={p.period}
                  style={{ width: `${width}%` }}
                  title={`${p.period}: ${p.count} paros (${Math.round(width)}%)`}
                  className={`h-full transition-all ${colors[idx % colors.length]}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Matutino</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Vespertino</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Nocturno</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
