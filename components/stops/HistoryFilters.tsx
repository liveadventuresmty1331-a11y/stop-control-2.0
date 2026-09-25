"use client";

import { 
  Search, 
  RotateCcw, 
  Download, 
  ArrowUpDown
} from "lucide-react";

export interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  machineId: string;
  areaId: string;
  processId: string;
  stopTypeId: string;
  causeId: string;
  priorityId: string;
  shift: string;
  status: string;
  sortBy: string;
  sortOrder: string;
}

interface CatalogItem {
  id: string;
  name: string;
  code?: string;
}

interface CatalogsData {
  machines: CatalogItem[];
  areas: CatalogItem[];
  processes: CatalogItem[];
  stopTypes: CatalogItem[];
  stopCauses: CatalogItem[];
  priorities: CatalogItem[];
}

interface HistoryFiltersProps {
  catalogs: CatalogsData;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  onExportCSV: () => void;
  isExporting: boolean;
  totalResults: number;
}

export default function HistoryFilters({
  catalogs,
  filters,
  onFilterChange,
  onReset,
  onExportCSV,
  isExporting,
  totalResults,
}: HistoryFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.machineId) ||
    Boolean(filters.areaId) ||
    Boolean(filters.processId) ||
    Boolean(filters.stopTypeId) ||
    Boolean(filters.causeId) ||
    Boolean(filters.priorityId) ||
    Boolean(filters.shift) ||
    filters.status !== "COMPLETED";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Barra superior: Búsqueda global, Ordenamiento y Botón Exportar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Buscar por máquina, operador, causa u orden de trabajo (OT)..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
          />
        </div>

        {/* Controles de Ordenamiento */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500">Ordenar:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange("sortBy", e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="startTime">Fecha de inicio</option>
              <option value="duration">Duración</option>
              <option value="machine">Código de máquina</option>
            </select>
          </div>

          <button
            onClick={() =>
              onFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
            }
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold text-slate-300 transition"
            title={filters.sortOrder === "asc" ? "Ascendente (A-Z, Menor a mayor)" : "Descendente (Z-A, Mayor a menor)"}
          >
            {filters.sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
          </button>

          {/* Botón de Exportación CSV */}
          <button
            onClick={onExportCSV}
            disabled={isExporting || totalResults === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-emerald-950"
            title="Exportar registros filtrados a CSV para Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exportando..." : "Exportar CSV"}</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula de Filtros Combinables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
        {/* Filtro Máquina */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Máquina</label>
          <select
            value={filters.machineId}
            onChange={(e) => onFilterChange("machineId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todas las máquinas</option>
            {catalogs.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Área */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Área</label>
          <select
            value={filters.areaId}
            onChange={(e) => onFilterChange("areaId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todas las áreas</option>
            {catalogs.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Proceso */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Proceso</label>
          <select
            value={filters.processId}
            onChange={(e) => onFilterChange("processId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todos los procesos</option>
            {catalogs.processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Tipo de Paro */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Tipo de Paro</label>
          <select
            value={filters.stopTypeId}
            onChange={(e) => onFilterChange("stopTypeId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todos los tipos</option>
            {catalogs.stopTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Causa */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Causa Raíz</label>
          <select
            value={filters.causeId}
            onChange={(e) => onFilterChange("causeId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todas las causas</option>
            {catalogs.stopCauses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Prioridad */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Prioridad</label>
          <select
            value={filters.priorityId}
            onChange={(e) => onFilterChange("priorityId", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todas las prioridades</option>
            {catalogs.priorities.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Turno */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Turno</label>
          <select
            value={filters.shift}
            onChange={(e) => onFilterChange("shift", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="">Todos los turnos</option>
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
            <option value="Nocturno">Nocturno</option>
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          >
            <option value="COMPLETED">Completados (Por defecto)</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="ALL">Todos los estados</option>
          </select>
        </div>

        {/* Rango de Fechas: Desde */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Desde (Fecha)</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>

        {/* Rango de Fechas: Hasta */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Hasta (Fecha)</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>
      </div>

      {/* Barra de estado de filtros y Botón Limpiar */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{totalResults}</span>
          <span>registros encontrados con los filtros activos.</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
}
