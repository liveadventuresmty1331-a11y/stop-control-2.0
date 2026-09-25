"use client";

import { useState } from "react";
import {
  PieChart,
  Activity,
  Timer,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { ParetoDashboardDatasets } from "@/lib/pareto-service";
import ParetoChart from "./ParetoChart";

interface ParetoSectionProps {
  pareto: ParetoDashboardDatasets;
}

type TabType = "all" | "causes" | "machine-freq" | "machine-time";

export default function ParetoSection({ pareto }: ParetoSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const { causesByFrequency, machinesByFrequency, machinesByDowntime } = pareto;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-6 shadow-xl">
      {/* Encabezado Principal de la Sección de Pareto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Análisis Estadístico • Principio 80/20
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40">
              <Sparkles className="w-3 h-3 text-rose-400" />
              FASE 10
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PieChart className="w-5 h-5 text-rose-500" />
            Diagramas de Pareto (Causas y Máquinas)
          </h2>

          <p className="text-sm text-slate-400 max-w-3xl">
            Identificación de los <strong className="text-slate-200">pocos vitales</strong> que
            concentran la mayor parte de las incidencias e indisponibilidad frente a los{" "}
            <span className="text-slate-400">muchos triviales</span>, optimizando la toma de
            decisiones y asignación de recursos de mantenimiento.
          </p>
        </div>

        {/* Selector de Pestañas / Modos de Visualización */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start lg:self-center overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Ver Todos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("causes")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "causes"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Causas (Frecuencia)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("machine-freq")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "machine-freq"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Máquinas (Frecuencia)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("machine-time")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "machine-time"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            Máquinas (Tiempo)
          </button>
        </div>
      </div>

      {/* Nota Metodológica Industrial: Distinción entre Frecuencia y Tiempo Perdido */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300 flex flex-col md:flex-row items-start gap-3">
        <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <p>
            <strong className="text-white">Criterio Operativo Industrial de STOPControl 2.0:</strong>{" "}
            Se separan de manera estricta el análisis por{" "}
            <span className="text-indigo-300 font-semibold">Frecuencia de Eventos (conteo)</span> y por{" "}
            <span className="text-amber-300 font-semibold">Tiempo Total de Paro (downtime en minutos)</span>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] text-slate-400">
            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-indigo-400 block mb-0.5">
                • Pareto por Frecuencia:
              </span>
              Detecta problemas crónicos, microparos reiterados o componentes con desgaste rápido
              que causan inestabilidad en la línea.
            </div>
            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">
                • Pareto por Tiempo de Paro:
              </span>
              Detecta fallas catastróficas o demoras logísticas/repuestos de gran impacto que restan
              disponibilidad directa a la producción.
            </div>
          </div>
        </div>
      </div>

      {/* Visualización según Pestaña Activa */}
      {activeTab === "all" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 1: Causas por Frecuencia */}
          <div className="flex flex-col">
            <ParetoChart data={causesByFrequency} accentColor="rose" />
          </div>

          {/* Gráfico 2: Máquinas por Frecuencia */}
          <div className="flex flex-col">
            <ParetoChart data={machinesByFrequency} accentColor="indigo" />
          </div>

          {/* Gráfico 3: Máquinas por Tiempo Total de Paro */}
          <div className="flex flex-col">
            <ParetoChart data={machinesByDowntime} accentColor="amber" />
          </div>
        </div>
      ) : activeTab === "causes" ? (
        <div className="max-w-4xl mx-auto w-full">
          <ParetoChart data={causesByFrequency} accentColor="rose" />
        </div>
      ) : activeTab === "machine-freq" ? (
        <div className="max-w-4xl mx-auto w-full">
          <ParetoChart data={machinesByFrequency} accentColor="indigo" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto w-full">
          <ParetoChart data={machinesByDowntime} accentColor="amber" />
        </div>
      )}
    </div>
  );
}
