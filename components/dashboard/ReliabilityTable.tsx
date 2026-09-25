"use client";

import { BarChart2 } from "lucide-react";
import { MachineReliabilityMetric } from "@/lib/reliability-service";
import { formatDurationMinutes } from "@/lib/utils";

interface ReliabilityTableProps {
  metrics: MachineReliabilityMetric[];
}

export default function ReliabilityTable({ metrics }: ReliabilityTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
        No hay datos de máquinas para comparar en este periodo.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-indigo-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Comparativa de Confiabilidad por Máquina
            </h3>
            <p className="text-[11px] text-slate-400">
              Desglose individual de MTTR, MTBF y Disponibilidad para análisis de activos
            </p>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {metrics.length} activos evaluados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3">Máquina</th>
              <th className="py-2.5 px-3">Área</th>
              <th className="py-2.5 px-3 text-center">Fallas Rep.</th>
              <th className="py-2.5 px-3 text-right">MTTR</th>
              <th className="py-2.5 px-3 text-center">Intervalos</th>
              <th className="py-2.5 px-3 text-right">MTBF</th>
              <th className="py-2.5 px-3 text-right">Paro Total</th>
              <th className="py-2.5 px-3 text-right min-w-[130px]">Disponibilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {metrics.map((m) => {
              const avail = m.availabilityPercent ?? 100;
              const isHighAvail = avail >= 90;
              const isMidAvail = avail >= 75 && avail < 90;
              const availColor = isHighAvail
                ? "text-emerald-400"
                : isMidAvail
                ? "text-amber-400"
                : "text-rose-400";

              const barColor = isHighAvail
                ? "bg-emerald-500"
                : isMidAvail
                ? "bg-amber-500"
                : "bg-rose-500";

              return (
                <tr key={m.machineId} className="hover:bg-slate-850/50 transition">
                  {/* Máquina */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs">
                        {m.machineCode}
                      </span>
                      <span className="text-slate-200 font-medium truncate max-w-[140px]" title={m.machineName}>
                        {m.machineName}
                      </span>
                    </div>
                  </td>

                  {/* Área */}
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {m.areaName}
                  </td>

                  {/* Fallas Reparables */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-mono font-bold text-xs ${
                        m.reparableFailuresCount > 0 ? "text-indigo-400" : "text-slate-500"
                      }`}
                    >
                      {m.reparableFailuresCount}
                    </span>
                  </td>

                  {/* MTTR */}
                  <td className="py-3 px-3 text-right font-mono">
                    {m.mttrMinutes !== null ? (
                      <span className="font-bold text-slate-200">{m.mttrFormatted}</span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Sin fallas</span>
                    )}
                  </td>

                  {/* Intervalos */}
                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    <span className={m.intervalsCount > 0 ? "text-amber-400 font-bold" : "text-slate-500"}>
                      {m.intervalsCount}
                    </span>
                  </td>

                  {/* MTBF */}
                  <td className="py-3 px-3 text-right font-mono">
                    {m.mtbfHours !== null ? (
                      <span className="font-bold text-amber-400">{m.mtbfFormatted}</span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic" title={m.mtbfFormatted}>
                        {m.reparableFailuresCount === 1 ? "Mín. 2 fallas" : "Sin fallas"}
                      </span>
                    )}
                  </td>

                  {/* Paro Total */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {formatDurationMinutes(m.totalDowntimeMinutes)}
                  </td>

                  {/* Disponibilidad */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-mono font-bold ${availColor}`}>
                        {m.availabilityFormatted}
                      </span>
                      <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${Math.min(100, Math.max(0, avail))}%` }}
                          className={`h-full rounded-full transition-all ${barColor}`}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
