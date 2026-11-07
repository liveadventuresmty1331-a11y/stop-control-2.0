"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Clock,
  ShieldCheck,
  Flame,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Wrench,
} from "lucide-react";
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

type DashboardTab = "overview" | "charts" | "pareto" | "reliability" | "all";

export default function DashboardView({
  initialData,
  user,
  catalogs,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // 30 segundos por defecto
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

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

  // Efecto para auto-refresco periódico
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
    <div className="flex flex-col gap-5">
      {/* Encabezado del Dashboard con Estado de Conexión y Acceso Directo a Paros Activos */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        {/* Marca de agua institucional sutil en el encabezado */}
        <div className="absolute -right-6 -bottom-6 pointer-events-none select-none opacity-[0.06] hidden md:block">
          <img
            src="/uin-logo.png"
            alt=""
            className="w-72 h-auto object-contain filter brightness-150"
          />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          {/* Logotipo de la Universidad en el encabezado del Dashboard (sin fondo blanco) */}
          <div className="flex items-center shrink-0">
            <img
              src="/uin-logo.png"
              alt="Universidad Interamericana del Norte"
              className="h-10 sm:h-16 w-auto object-contain filter brightness-125 drop-shadow-md"
              title="Universidad Interamericana del Norte"
            />
          </div>

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
              Dashboard de KPIs y Control de Planta
            </h1>

            <p className="text-sm text-slate-400">
              Control de tiempos de inactividad, disponibilidad operativa y registro de eventos de paro.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* Botón directo a Paros Activos para todos los perfiles */}
          <Link
            href="/active-stops"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition shadow-sm ${
              data.kpis.activeStopsCount > 0
                ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-950/50"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
            title="Ver o gestionar paros actualmente activos en planta"
          >
            <Flame
              className={`w-4 h-4 ${
                data.kpis.activeStopsCount > 0 ? "text-rose-200 animate-pulse" : "text-slate-400"
              }`}
            />
            <span>
              Paros Activos {data.kpis.activeStopsCount > 0 ? `(${data.kpis.activeStopsCount})` : ""}
            </span>
          </Link>

          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider justify-end">
              <Clock className="w-3 h-3" />
              <span>Sincronizado</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider justify-end">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Perfil</span>
            </div>
            <span className="text-xs font-bold text-purple-300 uppercase">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Banner de Alerta Destacado si hay Paros Activos en Curso */}
      {data.kpis.activeStopsCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-600/70 bg-gradient-to-r from-rose-950/80 via-rose-900/50 to-slate-900/80 shadow-lg shadow-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600/30 border border-rose-500/50 text-rose-300">
              <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {data.kpis.activeStopsCount} Paro{data.kpis.activeStopsCount === 1 ? "" : "s"} Activo{data.kpis.activeStopsCount === 1 ? "" : "s"} en Curso
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                  Atención en piso
                </span>
              </h4>
              <p className="text-xs text-rose-200/80">
                Hay {data.kpis.stoppedMachinesCount} máquina{data.kpis.stoppedMachinesCount === 1 ? "" : "s"} detenida{data.kpis.stoppedMachinesCount === 1 ? "" : "s"} generando tiempo muerto en este momento.
              </p>
            </div>
          </div>
          <Link
            href="/active-stops"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition self-start sm:self-auto active:scale-95"
          >
            <span>Ver Paros Activos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Barra de Filtros Combinables con accesos rápidos de tiempo (1 mes, hoy, etc.) */}
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

      {/* Pestañas de Navegación del Dashboard (Vista limpia y organizada) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Vista General (Resumen)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("charts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "charts"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Gráficas y Tendencias de Paro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pareto")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "pareto"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Análisis Pareto 80/20</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reliability")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "reliability"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Confiabilidad (MTTR / MTBF)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "all"
              ? "bg-slate-900 text-rose-400 border-rose-500 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Vista Completa</span>
        </button>
      </div>

      {/* Contenido Modular según la pestaña activa */}

      {/* PESTAÑA 1: VISTA GENERAL (RESUMEN) */}
      {(activeTab === "overview" || activeTab === "all") && (
        <div className="flex flex-col gap-6">
          {/* Indicadores Clave de Desempeño (KPIs de Planta) */}
          <DashboardKPIs kpis={data.kpis} />

          {/* Gráficos de Tendencias con soporte mensual y diario */}
          <DashboardCharts charts={data.charts} />

          {/* Grid de Estado de Máquinas con Cronómetro en Vivo */}
          <MachineStatusGrid
            machines={data.machinesStatus}
            canManageStops={canManageStops}
          />
        </div>
      )}

      {/* PESTAÑA 2: GRÁFICAS Y TENDENCIAS */}
      {activeTab === "charts" && (
        <div className="flex flex-col gap-6">
          <DashboardCharts charts={data.charts} />
        </div>
      )}

      {/* PESTAÑA 3: ANÁLISIS PARETO 80/20 */}
      {(activeTab === "pareto" || activeTab === "all") && (
        <div className="flex flex-col gap-6">
          <ParetoSection pareto={data.pareto} />
        </div>
      )}

      {/* PESTAÑA 4: CONFIABILIDAD (MTTR / MTBF) */}
      {(activeTab === "reliability" || activeTab === "all") && (
        <div className="flex flex-col gap-6">
          {/* Indicadores de Confiabilidad y Mantenimiento */}
          <ReliabilityKPIs reliability={data.reliability} />

          {/* Comparativa de Confiabilidad por Máquina */}
          <ReliabilityTable metrics={data.reliability.byMachine} />
        </div>
      )}
    </div>
  );
}
