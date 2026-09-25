"use client";

import { Wrench, Zap, Percent, Info } from "lucide-react";
import { ReliabilityIndicators } from "@/lib/reliability-service";

interface ReliabilityKPIsProps {
  reliability: ReliabilityIndicators;
}

export default function ReliabilityKPIs({ reliability }: ReliabilityKPIsProps) {
  const isGoodAvailability =
    reliability.availabilityPercent !== null && reliability.availabilityPercent >= 90;
  const isMidAvailability =
    reliability.availabilityPercent !== null &&
    reliability.availabilityPercent >= 75 &&
    reliability.availabilityPercent < 90;

  const availabilityBorder = isGoodAvailability
    ? "border-emerald-600/60 bg-emerald-950/20"
    : isMidAvailability
    ? "border-amber-600/60 bg-amber-950/20"
    : "border-rose-600/60 bg-rose-950/20";

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado de la sección de Confiabilidad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Indicadores de Confiabilidad y Mantenimiento (FASE 9)
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo formal de MTTR, MTBF y Disponibilidad según normas de ingeniería industrial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            {reliability.selectedMachineCode
              ? `Máquina: ${reliability.selectedMachineCode}`
              : "Ámbito: Parque completo de maquinaria"}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300">
            {reliability.periodLabel}
          </span>
        </div>
      </div>

      {/* Grid de Tarjetas de Confiabilidad: MTTR, MTBF y Disponibilidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. MTTR (Mean Time To Repair) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                MTTR (Tiempo Medio de Reparación)
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold font-mono tracking-tight text-white">
              {reliability.mttrFormatted}
            </div>
            <p className="text-xs text-slate-400">
              {reliability.reparableFailuresCount > 0 ? (
                <>
                  <strong className="text-slate-200">
                    {reliability.totalRepairMinutes} min totales
                  </strong>{" "}
                  en {reliability.reparableFailuresCount} falla
                  {reliability.reparableFailuresCount === 1 ? "" : "s"} reparable
                  {reliability.reparableFailuresCount === 1 ? "" : "s"}
                </>
              ) : (
                "Sin fallas técnicas reparables en el periodo"
              )}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fórmula: Tiempo reparación / N° fallas</span>
            <span className="font-mono text-indigo-400">Objetivo: Reducir</span>
          </div>
        </div>

        {/* 2. MTBF (Mean Time Between Failures) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                MTBF (Tiempo Medio Entre Fallas)
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div
              className={`text-3xl font-bold font-mono tracking-tight ${
                reliability.mtbfHours !== null ? "text-amber-400" : "text-slate-400 text-xl"
              }`}
            >
              {reliability.mtbfFormatted}
            </div>
            <p className="text-xs text-slate-400">
              {reliability.totalIntervalsCount > 0 ? (
                <>
                  <strong className="text-slate-200">
                    {reliability.totalOperatingHoursBetweenFailures} h operativas
                  </strong>{" "}
                  en {reliability.totalIntervalsCount} intervalo
                  {reliability.totalIntervalsCount === 1 ? "" : "s"} entre fallas
                </>
              ) : reliability.reparableFailuresCount === 1 ? (
                "Requiere al menos 2 fallas en la misma máquina para medir intervalos"
              ) : (
                "Sin fallas consecutivas para calcular intervalos"
              )}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fórmula: Tiempo operativo / Intervalos</span>
            <span className="font-mono text-amber-400">Objetivo: Aumentar</span>
          </div>
        </div>

        {/* 3. Disponibilidad Operativa */}
        <div
          className={`rounded-xl border p-5 flex flex-col justify-between shadow-sm transition relative overflow-hidden ${availabilityBorder}`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Disponibilidad Operativa
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-current text-white">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold font-mono tracking-tight text-white">
              {reliability.availabilityFormatted}
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">
                {(reliability.totalActualOperatingMinutes / 60).toFixed(1)} h
              </strong>{" "}
              operativas de {(reliability.totalPlannedOperatingMinutes / 60).toFixed(1)} h planificadas (24h/día)
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Fórmula: (T. Operativo / T. Planificado) × 100</span>
            <span className="font-mono font-bold text-white">
              Paro total: {reliability.totalDowntimeMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Nota técnica de Criterio Oficial */}
      <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-300">Criterio Oficial de Fallas Reparables:</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {reliability.criteriaNotes.reparableCriteria}
          </p>
        </div>
      </div>
    </div>
  );
}
