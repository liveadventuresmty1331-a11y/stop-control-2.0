"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Clock, ShieldCheck } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { DashboardData, DashboardFilters } from "@/lib/dashboard-service";
import DashboardKPIs from "./DashboardKPIs";
import MachineStatusGrid from "./MachineStatusGrid";
import DashboardCharts from "./DashboardCharts";
import DashboardFiltersBar from "./DashboardFiltersBar";
import ReliabilityKPIs from "./ReliabilityKPIs";
import ReliabilityTable from "./ReliabilityTable";
import ParetoSection from "./ParetoSection";

interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  areaId?: string;
}

interface DashboardViewProps {
  initialData: DashboardData;
  user: SessionUser;
  catalogs: {
    areas: CatalogItem[];
    machines: CatalogItem[];
    stopCauses: CatalogItem[];
  };
}

export default function DashboardView({
  initialData,
  user,
  catalogs,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // 30 segundos por defecto para piso de planta

  // Función para obtener los datos actualizados del endpoint /api/dashboard
  const fetchDashboardData = useCallback(
    async (activeFilters: DashboardFilters) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeFilters.dateFrom) params.set("dateFrom", activeFilters.dateFrom);
        if (activeFilters.dateTo) params.set("dateTo", activeFilters.dateTo);
        if (activeFilters.machineId) params.set("machineId", activeFilters.machineId);
        if (activeFilters.areaId) params.set("areaId", activeFilters.areaId);
        if (activeFilters.causeId) params.set("causeId", activeFilters.causeId);
        if (activeFilters.shift) params.set("shift", activeFilters.shift);

        const url = `/api/dashboard?${params.toString()}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            setData(json.data);
            setLastUpdated(new Date());
          }
        }
      } catch (err) {
        console.error("Error al refrescar datos del dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Efecto para auto-refresco periódico (polling industrial controlado)
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchDashboardData(filters);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, filters, fetchDashboardData]);

  const handleApplyFilters = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
    fetchDashboardData(newFilters);
  };

  const handleManualRefresh = () => {
    fetchDashboardData(filters);
  };

  const canManageStops = user.role === "ADMINISTRADOR" || user.role === "OPERADOR";

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado del Dashboard con Estado de Conexión en Vivo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Panel Principal • Monitoreo Industrial
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tiempo Real
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-rose-500" />
            Dashboard de KPIs y Estado de Máquinas
          </h1>

          <p className="text-sm text-slate-400">
            Visualización consolidada de tiempos de inactividad, disponibilidad y eventos de paro en planta.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider justify-end">
              <Clock className="w-3 h-3" />
              <span>Última sincronización</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider justify-end">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Alcance RBAC</span>
            </div>
            <span className="text-xs font-bold text-purple-300 uppercase">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Combinables */}
      <DashboardFiltersBar
        filters={filters}
        areas={catalogs.areas}
        machines={catalogs.machines}
        causes={catalogs.stopCauses}
        onApplyFilters={handleApplyFilters}
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
        refreshInterval={refreshInterval}
        onChangeRefreshInterval={setRefreshInterval}
      />

      {/* Indicadores Clave de Desempeño (KPIs de Planta) */}
      <DashboardKPIs kpis={data.kpis} />

      {/* Indicadores de Confiabilidad y Mantenimiento (FASE 9: MTTR, MTBF, Disponibilidad) */}
      <ReliabilityKPIs reliability={data.reliability} />

      {/* Comparativa de Confiabilidad por Máquina */}
      <ReliabilityTable metrics={data.reliability.byMachine} />

      {/* Grid de Estado de Máquinas con Cronómetro en Vivo */}
      <MachineStatusGrid
        machines={data.machinesStatus}
        canManageStops={canManageStops}
      />

      {/* Análisis Estadístico 80/20 (FASE 10: Diagramas de Pareto) */}
      <ParetoSection pareto={data.pareto} />

      {/* Gráficos de Tendencias y Distribuciones */}
      <DashboardCharts charts={data.charts} />
    </div>
  );
}
