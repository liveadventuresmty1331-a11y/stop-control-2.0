"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  AlertTriangle,
  Layers,
  Calendar,
  CalendarDays,
  Filter,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Cpu,
  Wrench,
  Clock,
} from "lucide-react";
import { DashboardCharts as DashboardChartsType } from "@/lib/dashboard-service";
import { formatDurationMinutes } from "@/lib/utils";

interface DashboardChartsProps {
  charts: DashboardChartsType;
}

type CardKey = "trend" | "machines" | "causes" | "shifts";
type ViewFilter = "all" | "trend" | "machines" | "causes" | "shifts";

export default function DashboardCharts({ charts }: DashboardChartsProps) {
  const {
    stopsByDay = [],
    stopsByMonth = [],
    stopsByPeriod = [],
    downtimeByMachine = [],
    stopsByCause = [],
  } = charts;

  // Filtro de vista rápida entre las gráficas integradas
  const [activeViewFilter, setActiveViewFilter] = useState<ViewFilter>("all");

  // Estado de colapso/minimizado por cada una de las tarjetas
  const [collapsedCards, setCollapsedCards] = useState<Record<CardKey, boolean>>({
    trend: false,
    machines: false,
    causes: false,
    shifts: true, // Turnos minimizada por defecto para dar protagonismo a las 3 principales
  });

  // Estado de tarjeta maximizada a ancho completo
  const [maximizedCard, setMaximizedCard] = useState<CardKey | null>(null);

  // Modo de visualización de la gráfica temporal: Diaria o Mensual
  const [timeGrouping, setTimeGrouping] = useState<"day" | "month">("month");
  // Filtro de mes específico (YYYY-MM o 'ALL')
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  // Control para mostrar más máquinas en la tarjeta de máquinas
  const [showAllMachines, setShowAllMachines] = useState(false);
  // Control para mostrar más causas en la tarjeta de causas
  const [showAllCauses, setShowAllCauses] = useState(false);

  // Funciones de control de expansión y minimizado
  const toggleCollapse = (key: CardKey) => {
    setCollapsedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMaximize = (key: CardKey) => {
    if (maximizedCard === key) {
      setMaximizedCard(null);
    } else {
      setMaximizedCard(key);
      setCollapsedCards((prev) => ({ ...prev, [key]: false }));
    }
  };

  const expandAll = () => {
    setCollapsedCards({
      trend: false,
      machines: false,
      causes: false,
      shifts: false,
    });
  };

  const collapseAll = () => {
    setCollapsedCards({
      trend: true,
      machines: true,
      causes: true,
      shifts: true,
    });
    setMaximizedCard(null);
  };

  // Lista de meses disponibles para el selector
  const availableMonths = useMemo(() => {
    return stopsByMonth.map((m) => ({
      value: m.month,
      label: m.fullLabel,
      shortLabel: m.label,
    }));
  }, [stopsByMonth]);

  // Días filtrados si el usuario seleccionó un mes específico
  const displayedDays = useMemo(() => {
    if (selectedMonth === "ALL") return stopsByDay;
    return stopsByDay.filter((d) => d.date.startsWith(selectedMonth));
  }, [stopsByDay, selectedMonth]);

  // Meses filtrados
  const displayedMonths = useMemo(() => {
    if (selectedMonth === "ALL") return stopsByMonth;
    return stopsByMonth.filter((m) => m.month === selectedMonth);
  }, [stopsByMonth, selectedMonth]);

  // Cálculo de totales y máximos para escala visual en barras
  const maxDayMinutes = Math.max(...displayedDays.map((d) => d.downtimeMinutes), 1);
  const maxMonthMinutes = Math.max(...displayedMonths.map((m) => m.downtimeMinutes), 1);
  const maxMachineMinutes = Math.max(...downtimeByMachine.map((m) => m.downtimeMinutes), 1);
  const maxCauseCount = Math.max(...stopsByCause.map((c) => c.count), 1);
  const totalPeriodStops = stopsByPeriod.reduce((acc, p) => acc + p.count, 0) || 1;

  // Totales de resumen para badges y el panel integrado de síntesis
  const totalTrendStops =
    timeGrouping === "month"
      ? displayedMonths.reduce((acc, m) => acc + m.count, 0)
      : displayedDays.reduce((acc, d) => acc + d.count, 0);
  const totalTrendMinutes =
    timeGrouping === "month"
      ? displayedMonths.reduce((acc, m) => acc + m.downtimeMinutes, 0)
      : displayedDays.reduce((acc, d) => acc + d.downtimeMinutes, 0);

  const topMachine = downtimeByMachine[0];
  const topCause = stopsByCause[0];

  // Determinar visibilidad de cada tarjeta según el filtro activo
  const shouldShowTrend = activeViewFilter === "all" || activeViewFilter === "trend";
  const shouldShowMachines = activeViewFilter === "all" || activeViewFilter === "machines";
  const shouldShowCauses = activeViewFilter === "all" || activeViewFilter === "causes";
  const shouldShowShifts = activeViewFilter === "all" || activeViewFilter === "shifts";

  return (
    <div className="flex flex-col gap-5">
      {/* ========================================================================= */}
      {/* BARRA DE HERRAMIENTAS: GRÁFICAS Y TENDENCIAS DE PARO                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Gráficas y Tendencias de Paro</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  3 Ejes Integrados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualización consolidada de Tiempo, Equipos afectados y Causas raíz
              </p>
            </div>
          </div>

          {/* Botones Globales de Control */}
          <div className="flex items-center gap-2">
            {maximizedCard && (
              <button
                type="button"
                onClick={() => setMaximizedCard(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Restaurar Cuadrícula</span>
              </button>
            )}

            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Desplegar todas las gráficas"
            >
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Expandir Todo</span>
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Minimizar todas las gráficas"
            >
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Minimizar Todo</span>
            </button>
          </div>
        </div>

        {/* Píldoras de Filtro para Navegar entre las 3 Gráficas Integradas */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Mostrar:
          </span>

          <button
            type="button"
            onClick={() => setActiveViewFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeViewFilter === "all"
                ? "bg-rose-600 text-white shadow-md shadow-rose-900/40 border border-rose-500"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-200" />
            <span>Las 3 Integradas de Paro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewFilter("trend")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeViewFilter === "trend"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-500"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Tendencia de Paros y Tiempos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewFilter("machines")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeViewFilter === "machines"
                ? "bg-rose-600 text-white shadow-md shadow-rose-900/40 border border-rose-500"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Tiempo de Paro Máquina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewFilter("causes")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeViewFilter === "causes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-500"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>3. Frecuencia por Causa Raíz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewFilter("shifts")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeViewFilter === "shifts"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-500"
                : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Distribución por Turno</span>
          </button>
        </div>

        {/* Resumen de Síntesis Integrada (Conecta las 3 dimensiones de Paro) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded bg-blue-950/50 border border-blue-800/40 text-blue-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                1. Tendencia Temporal
              </div>
              <div className="text-xs font-mono font-bold text-white truncate">
                {totalTrendStops} paros ({formatDurationMinutes(totalTrendMinutes)})
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded bg-rose-950/50 border border-rose-800/40 text-rose-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                2. Máquina Crítica
              </div>
              <div className="text-xs font-bold text-rose-300 truncate" title={topMachine?.machineName}>
                {topMachine ? `${topMachine.machineCode} • ${formatDurationMinutes(topMachine.downtimeMinutes)}` : "Sin paros"}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded bg-purple-950/50 border border-purple-800/40 text-purple-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                3. Causa Principal
              </div>
              <div className="text-xs font-bold text-purple-300 truncate" title={topCause?.causeName}>
                {topCause ? `${topCause.causeName} (${topCause.percentage}%)` : "Sin incidencias"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUADRÍCULA DE LAS GRÁFICAS INTEGRADAS DE PARO                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================================= */}
        {/* 1. TENDENCIA DE PAROS Y TIEMPOS (Eje temporal principal)                 */}
        {/* ========================================================================= */}
        {shouldShowTrend && (
          <div
            className={`rounded-xl border transition-all duration-200 shadow-sm ${
              maximizedCard === "trend" || activeViewFilter === "trend" || activeViewFilter === "all"
                ? "col-span-1 lg:col-span-2 border-blue-500/50 bg-slate-900/90 shadow-xl"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            } p-5 flex flex-col justify-between`}
          >
            {/* Cabecera */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
                    {timeGrouping === "month" ? (
                      <CalendarDays className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>TENDENCIA DE PAROS Y TIEMPOS</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {timeGrouping === "month" ? "Mensual" : "Diaria"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {timeGrouping === "month"
                        ? "Acumulado mensual de minutos inactivos y eventos de paro"
                        : "Evolución por día de minutos de paro y eventos"}
                    </p>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="flex items-center gap-1.5">
                  {!collapsedCards.trend && (
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 mr-1">
                      <button
                        type="button"
                        onClick={() => setTimeGrouping("month")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                          timeGrouping === "month"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <CalendarDays className="w-3 h-3" />
                        <span>Mensual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeGrouping("day")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                          timeGrouping === "day"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Diaria</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleMaximize("trend")}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                      maximizedCard === "trend"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
                    }`}
                    title={
                      maximizedCard === "trend"
                        ? "Restaurar ancho"
                        : "Expandir a ancho completo"
                    }
                  >
                    {maximizedCard === "trend" ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCollapse("trend")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
                  >
                    {collapsedCards.trend ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desplegar</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                        <span>Minimizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resumen si está MINIMIZADA */}
              {collapsedCards.trend && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">
                      Total: <strong className="text-white">{totalTrendStops}</strong> eventos
                    </span>
                    <span>•</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {formatDurationMinutes(totalTrendMinutes)} inactivos
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">
                      {timeGrouping === "month"
                        ? `${displayedMonths.length} mes(es)`
                        : `${displayedDays.length} día(s)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapse("trend")}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    Ver gráfica completa →
                  </button>
                </div>
              )}
            </div>

            {/* Contenido Completo */}
            {!collapsedCards.trend && (
              <div className="mt-4 space-y-3">
                {/* Filtro de Mes Específico */}
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-medium">Filtrar por mes:</span>
                  </div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="ALL">Todos los meses registrados ({stopsByMonth.length})</option>
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VISTA MENSUAL */}
                {timeGrouping === "month" ? (
                  displayedMonths.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No hay paros registrados en los meses seleccionados.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-end gap-3 pt-6 pb-2 px-1 border-b border-slate-800 h-52">
                        {displayedMonths.map((m) => {
                          const heightPercent = Math.max(
                            10,
                            Math.round((m.downtimeMinutes / maxMonthMinutes) * 100)
                          );
                          return (
                            <div
                              key={m.month}
                              className="flex-1 flex flex-col items-center gap-1.5 group relative"
                            >
                              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded border border-slate-700 shadow-xl whitespace-nowrap z-20 text-center">
                                <div className="font-bold text-rose-300">{m.fullLabel}</div>
                                <div>
                                  {m.count} paro{m.count === 1 ? "" : "s"} •{" "}
                                  {formatDurationMinutes(m.downtimeMinutes)}
                                </div>
                              </div>

                              <div className="w-full flex items-end justify-center h-36">
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className="w-full max-w-[56px] rounded-t bg-gradient-to-t from-rose-700 via-rose-500 to-indigo-400 group-hover:from-rose-500 group-hover:to-rose-300 transition-all cursor-pointer relative shadow-sm"
                                >
                                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-200">
                                    {m.count}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[11px] font-mono font-semibold text-slate-300 group-hover:text-white transition">
                                {m.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                        <span>Altura de barra = Minutos acumulados en el mes</span>
                        <span>Número superior = Paros registrados</span>
                      </div>
                    </div>
                  )
                ) : (
                  /* VISTA DIARIA */
                  displayedDays.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No hay paros completados en las fechas seleccionadas.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-end gap-2 pt-6 pb-2 px-1 border-b border-slate-800 h-52">
                        {displayedDays.map((d) => {
                          const heightPercent = Math.max(
                            8,
                            Math.round((d.downtimeMinutes / maxDayMinutes) * 100)
                          );
                          return (
                            <div
                              key={d.date}
                              className="flex-1 flex flex-col items-center gap-1.5 group relative"
                            >
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-20">
                                <span className="font-bold">{d.label}:</span> {d.count} paro
                                {d.count === 1 ? "" : "s"} ({formatDurationMinutes(d.downtimeMinutes)})
                              </div>

                              <div className="w-full flex items-end justify-center h-36">
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className="w-full max-w-[32px] rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-rose-500 group-hover:to-rose-400 transition-all cursor-pointer relative"
                                >
                                  {d.count > 0 && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-300">
                                      {d.count}
                                    </span>
                                  )}
                                </div>
                              </div>

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
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TIEMPO DE PARO MAQUINA                                                */}
        {/* ========================================================================= */}
        {shouldShowMachines && (
          <div
            className={`rounded-xl border transition-all duration-200 shadow-sm ${
              maximizedCard === "machines" || activeViewFilter === "machines"
                ? "col-span-1 lg:col-span-2 border-rose-500/60 bg-slate-900/90 shadow-2xl ring-1 ring-rose-500/30"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            } p-5 flex flex-col justify-between`}
          >
            {/* Cabecera */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>TIEMPO DE PARO MAQUINA</span>
                      {maximizedCard === "machines" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Vista Ampliada
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Distribución de minutos de inactividad acumulados por máquina
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleMaximize("machines")}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                      maximizedCard === "machines"
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
                    }`}
                    title={
                      maximizedCard === "machines"
                        ? "Restaurar ancho normal"
                        : "Expandir a ancho completo"
                    }
                  >
                    {maximizedCard === "machines" ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCollapse("machines")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
                  >
                    {collapsedCards.machines ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desplegar</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                        <span>Minimizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resumen si está MINIMIZADA */}
              {collapsedCards.machines && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">
                      Máquinas: <strong className="text-white">{downtimeByMachine.length}</strong>
                    </span>
                    {topMachine && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-rose-400">
                          Crítica: <strong>{topMachine.machineCode}</strong> (
                          {formatDurationMinutes(topMachine.downtimeMinutes)})
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapse("machines")}
                    className="text-xs text-rose-400 hover:underline font-semibold"
                  >
                    Ver ranking →
                  </button>
                </div>
              )}
            </div>

            {/* Contenido Completo */}
            {!collapsedCards.machines && (
              <div className="mt-4 space-y-3">
                {downtimeByMachine.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No hay paros registrados para las máquinas en este periodo.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(maximizedCard === "machines" || showAllMachines
                      ? downtimeByMachine
                      : downtimeByMachine.slice(0, 5)
                    ).map((m, idx) => {
                      const widthPercent = Math.max(
                        4,
                        Math.round((m.downtimeMinutes / maxMachineMinutes) * 100)
                      );
                      return (
                        <div key={m.machineCode} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono font-bold text-slate-300 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
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
                                idx === 0
                                  ? "bg-rose-500"
                                  : idx === 1
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {downtimeByMachine.length > 5 && maximizedCard !== "machines" && (
                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={() => setShowAllMachines(!showAllMachines)}
                          className="text-xs text-slate-400 hover:text-rose-400 font-medium transition"
                        >
                          {showAllMachines
                            ? "Mostrar solo Top 5"
                            : `Ver todas las máquinas (${downtimeByMachine.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. FRECUENCIA POR CAUZA RAIZ                                             */}
        {/* ========================================================================= */}
        {shouldShowCauses && (
          <div
            className={`rounded-xl border transition-all duration-200 shadow-sm ${
              maximizedCard === "causes" || activeViewFilter === "causes"
                ? "col-span-1 lg:col-span-2 border-purple-500/60 bg-slate-900/90 shadow-2xl ring-1 ring-purple-500/30"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            } p-5 flex flex-col justify-between`}
          >
            {/* Cabecera */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>FRECUENCIA POR CAUZA RAIZ</span>
                      {maximizedCard === "causes" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Vista Ampliada
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Incidencia y porcentaje de recurrencia por causa de paro
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleMaximize("causes")}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                      maximizedCard === "causes"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
                    }`}
                    title={
                      maximizedCard === "causes"
                        ? "Restaurar ancho normal"
                        : "Expandir a ancho completo"
                    }
                  >
                    {maximizedCard === "causes" ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCollapse("causes")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
                  >
                    {collapsedCards.causes ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desplegar</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                        <span>Minimizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resumen si está MINIMIZADA */}
              {collapsedCards.causes && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">
                      Causas: <strong className="text-white">{stopsByCause.length}</strong>
                    </span>
                    {topCause && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-purple-400 truncate max-w-[220px]">
                          Frecuente: <strong>{topCause.causeName}</strong> ({topCause.count} eventos)
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapse("causes")}
                    className="text-xs text-purple-400 hover:underline font-semibold"
                  >
                    Ver causas raíz →
                  </button>
                </div>
              )}
            </div>

            {/* Contenido Completo */}
            {!collapsedCards.causes && (
              <div className="mt-4 space-y-3">
                {stopsByCause.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No hay paros registrados para las causas analizadas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(maximizedCard === "causes" || showAllCauses
                      ? stopsByCause
                      : stopsByCause.slice(0, 5)
                    ).map((c, idx) => {
                      const barPercent = Math.max(
                        5,
                        Math.round((c.count / maxCauseCount) * 100)
                      );
                      return (
                        <div key={c.causeName} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className="text-slate-300 font-medium truncate"
                              title={c.causeName}
                            >
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

                    {stopsByCause.length > 5 && maximizedCard !== "causes" && (
                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={() => setShowAllCauses(!showAllCauses)}
                          className="text-xs text-slate-400 hover:text-purple-400 font-medium transition"
                        >
                          {showAllCauses
                            ? "Mostrar solo Top 5"
                            : `Ver todas las causas (${stopsByCause.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. DISTRIBUCION POR TURNO (Sección complementaria)                       */}
        {/* ========================================================================= */}
        {shouldShowShifts && (
          <div
            className={`rounded-xl border transition-all duration-200 shadow-sm col-span-1 lg:col-span-2 ${
              collapsedCards.shifts
                ? "border-slate-800/80 bg-slate-950/40"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            } p-4 flex flex-col justify-between`}
          >
            {/* Cabecera */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>DISTRIBUCION POR TURNO</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Información Complementaria de Operación)
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCollapse("shifts")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
                >
                  {collapsedCards.shifts ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Desplegar Turnos</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
                      <span>Minimizar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resumen Compacto cuando está MINIMIZADA */}
              {collapsedCards.shifts && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {stopsByPeriod.map((p) => (
                      <span key={p.period}>
                        {p.period}: <strong className="text-white">{p.count}</strong> paros
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollapse("shifts")}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Ver desglose completo de turnos →
                  </button>
                </div>
              )}
            </div>

            {/* Contenido Completo */}
            {!collapsedCards.shifts && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {stopsByPeriod.map((p) => {
                    const percent =
                      totalPeriodStops > 0 ? Math.round((p.count / totalPeriodStops) * 100) : 0;
                    return (
                      <div
                        key={p.period}
                        className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 flex flex-col items-center text-center gap-1"
                      >
                        <span className="text-xs font-semibold text-slate-300">{p.period}</span>
                        <span className="text-2xl font-bold font-mono text-emerald-400">
                          {p.count}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDurationMinutes(p.downtimeMinutes)} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden flex border border-slate-800">
                  {stopsByPeriod.map((p, idx) => {
                    const width =
                      totalPeriodStops > 0 ? (p.count / totalPeriodStops) * 100 : 33.3;
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
