"use client";

import Link from "next/link";
import { Clock, AlertTriangle, AlertOctagon, Flame, CheckCircle2, Wrench, ArrowRight } from "lucide-react";
import { DashboardKPIs as DashboardKPIsType } from "@/lib/dashboard-service";

interface DashboardKPIsProps {
  kpis: DashboardKPIsType;
}

export default function DashboardKPIs({ kpis }: DashboardKPIsProps) {
  const isGoodAvailability = kpis.availabilityPercent >= 85;
  const isMidAvailability = kpis.availabilityPercent >= 70 && kpis.availabilityPercent < 85;

  const availabilityColor = isGoodAvailability
    ? "text-emerald-400 border-emerald-800/60 bg-emerald-950/20"
    : isMidAvailability
    ? "text-amber-400 border-amber-800/60 bg-amber-950/20"
    : "text-rose-400 border-rose-800/60 bg-rose-950/20";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Tiempo Total de Paro */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tiempo Total Paro
          </span>
          <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {kpis.totalDowntimeFormatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {kpis.totalDowntimeMinutes} minutos acumulados
          </p>
        </div>
      </div>

      {/* 2. Total de Paros */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total de Paros
          </span>
          <div className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {kpis.totalStopsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Eventos en el periodo
          </p>
        </div>
      </div>

      {/* 3. Máquina con Mayor Paro */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mayor Tiempo Paro
          </span>
          <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-400 truncate">
              {kpis.topDowntimeMachine?.code || "N/A"}
            </span>
            {kpis.topDowntimeMachine && kpis.topDowntimeMachine.minutes > 0 && (
              <span className="text-xs text-slate-400 font-mono">
                ({kpis.topDowntimeMachine.formatted})
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5" title={kpis.topDowntimeMachine?.name}>
            {kpis.topDowntimeMachine?.name || "Sin paros registrados"}
          </p>
        </div>
      </div>

      {/* 4. Causa Más Frecuente */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Causa Más Frecuente
          </span>
          <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-white truncate" title={kpis.topCause?.name}>
            {kpis.topCause?.name || "N/A"}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {kpis.topCause && kpis.topCause.count > 0 ? (
              <>
                <strong className="text-slate-200">{kpis.topCause.count} eventos</strong> ({kpis.topCause.percentage}% del total)
              </>
            ) : (
              "Sin incidencias"
            )}
          </p>
        </div>
      </div>

      {/* 5. Paros Activos en Curso */}
      <div
        className={`rounded-xl border p-4 flex flex-col justify-between shadow-sm transition ${
          kpis.activeStopsCount > 0
            ? "border-rose-700/80 bg-rose-950/30"
            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Paros Activos
          </span>
          <div
            className={`p-1.5 rounded-lg border ${
              kpis.activeStopsCount > 0
                ? "bg-rose-900/60 border-rose-600 text-rose-300 animate-pulse"
                : "bg-slate-800/50 border-slate-700 text-slate-400"
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                kpis.activeStopsCount > 0 ? "text-rose-400" : "text-slate-300"
              }`}
            >
              {kpis.activeStopsCount}
            </span>
            {kpis.activeStopsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                En curso
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {kpis.stoppedMachinesCount} máquina{kpis.stoppedMachinesCount === 1 ? "" : "s"} detenida{kpis.stoppedMachinesCount === 1 ? "" : "s"}
          </p>
          <Link
            href="/active-stops"
            className={`mt-2.5 inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition group ${
              kpis.activeStopsCount > 0
                ? "bg-rose-900/40 hover:bg-rose-900/70 border-rose-700/60 text-rose-300"
                : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Ver Paros Activos</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 6. Disponibilidad de Máquinas */}
      <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-sm ${availabilityColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Disponibilidad
          </span>
          <div className="p-1.5 rounded-lg bg-slate-900/60 border border-current">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {kpis.availabilityPercent}%
          </div>
          <p className="text-[11px] opacity-80 mt-0.5">
            {kpis.operatingMachinesCount} de {kpis.totalActiveMachines} operando
          </p>
        </div>
      </div>
    </div>
  );
}
