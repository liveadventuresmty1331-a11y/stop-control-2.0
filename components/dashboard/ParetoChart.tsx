"use client";

import { AlertCircle, Target, TrendingUp } from "lucide-react";
import { ParetoAnalysisResult } from "@/lib/pareto-service";

interface ParetoChartProps {
  data: ParetoAnalysisResult;
  accentColor?: "rose" | "indigo" | "amber";
}

export default function ParetoChart({
  data,
  accentColor = "rose",
}: ParetoChartProps) {
  if (data.isEmpty || data.items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-8 h-8 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-300">{data.title}</h4>
        <p className="text-xs text-slate-500 max-w-md">
          Sin datos suficientes en el periodo o filtros seleccionados para generar el análisis de Pareto.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.items.map((i) => i.value), 1);

  // Paleta según acento
  const barVitalClass =
    accentColor === "rose"
      ? "bg-gradient-to-r from-rose-600 to-rose-500 text-rose-300 border-rose-500/40"
      : accentColor === "indigo"
      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-indigo-300 border-indigo-500/40"
      : "bg-gradient-to-r from-amber-600 to-amber-500 text-amber-300 border-amber-500/40";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm gap-5">
      {/* Encabezado del Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              {data.title}
            </h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              Total: {data.formattedTotal}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Target className="w-3 h-3" />
            {data.vitalFewCount} de {data.itemsCount} concentran el ~80%
          </span>
        </div>
      </div>

      {/* Gráfico de Barras y Curva Acumulada */}
      <div className="space-y-3.5">
        {data.items.map((item) => {
          const widthPercent = Math.max(6, Math.round((item.value / maxValue) * 100));

          return (
            <div key={item.id} className="flex flex-col gap-1 group relative">
              {/* Información superior de la barra */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] font-bold text-slate-400 w-5">
                    #{item.rank}
                  </span>
                  {item.code && (
                    <span className="font-mono font-bold text-slate-200 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[10px]">
                      {item.code}
                    </span>
                  )}
                  <span
                    className={`font-medium truncate max-w-[200px] sm:max-w-xs ${
                      item.isVitalFew ? "text-white font-semibold" : "text-slate-300"
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  {item.isVitalFew && (
                    <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-950/60 border border-rose-800/60 text-rose-400">
                      Poco Vital
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                  <span className="text-slate-300 font-bold">{item.formattedValue}</span>
                  <span className="text-slate-400 w-12 text-right">
                    {item.percentage}%
                  </span>
                  <span
                    className={`w-14 text-right font-bold ${
                      item.cumulativePercentage <= 80
                        ? "text-rose-400"
                        : "text-indigo-400"
                    }`}
                    title={`Acumulado: ${item.cumulativePercentage}%`}
                  >
                    ({item.cumulativePercentage}%)
                  </span>
                </div>
              </div>

              {/* Barra de impacto individual y referencia visual acumulada */}
              <div className="relative w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800/80">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className={`h-full rounded-full transition-all ${
                    item.isVitalFew ? barVitalClass : "bg-slate-700 text-slate-400"
                  }`}
                />
              </div>

              {/* Tooltip detallado en hover */}
              <div className="hidden group-hover:flex absolute -top-8 right-0 bg-slate-950 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-800 shadow-xl z-20 pointer-events-none items-center gap-2">
                <span>
                  <strong>{item.name}:</strong> {item.formattedValue} ({item.percentage}%)
                </span>
                <span className="text-rose-400">
                  Acumulado: {item.cumulativePercentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda y Criterio de la Regla del 80% */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-medium">Pocos vitales (≤ ~80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Muchos útiles (&gt; 80%)</span>
          </div>
        </div>

        <span className="font-mono text-slate-500">
          Valores entre paréntesis = % acumulado
        </span>
      </div>
    </div>
  );
}
