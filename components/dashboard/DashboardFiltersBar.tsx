"use client";

import { useState, useEffect } from "react";
import {
  Filter,
  RotateCcw,
  RefreshCw,
  Calendar,
  CalendarRange,
  MapPin,
  Cpu,
  Wrench,
  Clock,
  Sparkles,
} from "lucide-react";
import { DashboardFilters } from "@/lib/dashboard-service";

interface CatalogOption {
  id: string;
  name: string;
  code?: string;
  areaId?: string;
}

interface DashboardFiltersBarProps {
  filters: DashboardFilters;
  areas: CatalogOption[];
  machines: CatalogOption[];
  causes: CatalogOption[];
  onApplyFilters: (newFilters: DashboardFilters) => void;
  onRefresh: () => void;
  isLoading: boolean;
  refreshInterval: number; // en segundos: 0 (desactivado), 15, 30, 60
  onChangeRefreshInterval: (seconds: number) => void;
}

export default function DashboardFiltersBar({
  filters,
  areas,
  machines,
  causes,
  onApplyFilters,
  onRefresh,
  isLoading,
  refreshInterval,
  onChangeRefreshInterval,
}: DashboardFiltersBarProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  // Mantener sincronizado si cambian los filtros desde el componente padre
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Filtrado reactivo de máquinas según área seleccionada
  const filteredMachines = localFilters.areaId
    ? machines.filter((m) => m.areaId === localFilters.areaId)
    : machines;

  const handleChange = (key: keyof DashboardFilters, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const emptyFilters: DashboardFilters = {};
    setLocalFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  // Función para aplicar filtros de tiempo preconfigurados (1 mes, 7 días, hoy, etc.)
  const applyTimePreset = (preset: "today" | "week" | "month" | "current_month" | "quarter" | "all") => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let from = "";
    let to = formatYMD(today);

    if (preset === "today") {
      from = formatYMD(today);
    } else if (preset === "week") {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      from = formatYMD(past);
    } else if (preset === "month") {
      // 1 Mes exacto (30 días anteriores a hoy)
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      from = formatYMD(past);
    } else if (preset === "current_month") {
      // Mes calendario actual (del día 1 hasta hoy)
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      from = formatYMD(firstDay);
    } else if (preset === "quarter") {
      const past = new Date(today);
      past.setDate(today.getDate() - 90);
      from = formatYMD(past);
    } else if (preset === "all") {
      from = "";
      to = "";
    }

    const updated: DashboardFilters = {
      ...localFilters,
      dateFrom: from || undefined,
      dateTo: to || undefined,
    };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  const hasActiveFilters = Boolean(
    localFilters.dateFrom ||
      localFilters.dateTo ||
      localFilters.machineId ||
      localFilters.areaId ||
      localFilters.causeId ||
      localFilters.shift
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-md backdrop-blur">
      <form onSubmit={handleApply} className="flex flex-col gap-3.5">
        {/* Fila superior: Título de filtros, auto-refresh y botón de recarga */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-300">
            <Filter className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Filtros del Tablero
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Filtros activos
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Auto-refresco */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] hidden sm:inline">Auto-recarga:</span>
              <select
                value={refreshInterval}
                onChange={(e) => onChangeRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-900 text-white">Manual</option>
                <option value={15} className="bg-slate-900 text-white">Cada 15s</option>
                <option value={30} className="bg-slate-900 text-white">Cada 30s</option>
                <option value={60} className="bg-slate-900 text-white">Cada 1 min</option>
              </select>
              {refreshInterval > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
              )}
            </div>

            {/* Botón de Refresco Manual */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Actualizar datos en tiempo real"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Fila de Accesos Rápidos de Tiempo (1 Mes, 7 Días, Hoy, etc.) */}
        <div className="flex flex-wrap items-center gap-2 py-1 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <CalendarRange className="w-3.5 h-3.5 text-rose-400" />
            Periodo rápido:
          </span>

          {/* Botón destacado de 1 Mes */}
          <button
            type="button"
            onClick={() => applyTimePreset("month")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40 border border-rose-500/60 transition active:scale-95"
            title="Ver los últimos 30 días"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-200" />
            <span>📅 1 Mes (Últimos 30 días)</span>
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset("today")}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset("week")}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset("current_month")}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Mes Actual
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset("quarter")}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            3 Meses
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset("all")}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            Todo el historial
          </button>
        </div>

        {/* Fila de Controles de Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Desde</span>
            </label>
            <input
              type="date"
              value={localFilters.dateFrom || ""}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Hasta</span>
            </label>
            <input
              type="date"
              value={localFilters.dateTo || ""}
              onChange={(e) => handleChange("dateTo", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Área */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>Área</span>
            </label>
            <select
              value={localFilters.areaId || ""}
              onChange={(e) => {
                handleChange("areaId", e.target.value);
                // Si el área cambia y la máquina actual no pertenece, resetear máquina
                handleChange("machineId", "");
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Máquina */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>Máquina</span>
            </label>
            <select
              value={localFilters.machineId || ""}
              onChange={(e) => handleChange("machineId", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Todas las máquinas</option>
              {filteredMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code ? `[${m.code}] ` : ""}{m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Causa */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-slate-500" />
              <span>Causa Raíz</span>
            </label>
            <select
              value={localFilters.causeId || ""}
              onChange={(e) => handleChange("causeId", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Todas las causas</option>
              {causes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Turno</span>
            </label>
            <select
              value={localFilters.shift || ""}
              onChange={(e) => handleChange("shift", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Todos los turnos</option>
              <option value="Matutino">Turno 1 - Matutino</option>
              <option value="Vespertino">Turno 2 - Vespertino</option>
              <option value="Nocturno">Turno 3 - Nocturno</option>
            </select>
          </div>
        </div>

        {/* Fila inferior: Botones de Acción */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-900/40 transition disabled:opacity-50"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Aplicar Filtros</span>
          </button>
        </div>
      </form>
    </div>
  );
}
