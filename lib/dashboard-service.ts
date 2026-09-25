import { db } from "./db";
import { SessionUser } from "./auth";
import { memoryStops } from "./stops-service";
import { getAllCatalogs } from "./catalogs-service";
import { formatDurationMinutes } from "./utils";
import {
  calculateReliabilityMetrics,
  ReliabilityIndicators,
  MachineReliabilityMetric,
} from "./reliability-service";

export { type ReliabilityIndicators, type MachineReliabilityMetric };

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  machineId?: string;
  areaId?: string;
  causeId?: string;
  shift?: string;
}

export interface ActiveStopInfo {
  id: string;
  startTime: string; // ISO string UTC
  causeName: string;
  stopTypeName: string;
  priorityName: string;
  priorityColor?: string;
  operatorName: string;
  shift: string;
  observations?: string | null;
}

export interface MachineStatusItem {
  id: string;
  code: string;
  name: string;
  areaId: string;
  areaName: string;
  status: "OPERATING" | "STOPPED" | "MAINTENANCE" | "OUT_OF_SERVICE";
  active: boolean;
  activeStop?: ActiveStopInfo | null;
}

export interface DashboardKPIs {
  totalDowntimeMinutes: number;
  totalDowntimeFormatted: string;
  totalStopsCount: number;
  topDowntimeMachine: {
    id: string;
    code: string;
    name: string;
    minutes: number;
    formatted: string;
  } | null;
  topCause: {
    id: string;
    name: string;
    count: number;
    percentage: number;
  } | null;
  activeStopsCount: number;
  stoppedMachinesCount: number;
  totalActiveMachines: number;
  operatingMachinesCount: number;
  availabilityPercent: number;

  // FASE 9: Indicadores de Confiabilidad y Mantenimiento
  mttrMinutes: number | null;
  mttrFormatted: string;
  mtbfHours: number | null;
  mtbfFormatted: string;
  reliabilityAvailabilityPercent: number | null;
  reliabilityAvailabilityFormatted: string;
}

export interface DayChartItem {
  date: string;
  label: string;
  count: number;
  downtimeMinutes: number;
}

export interface PeriodChartItem {
  period: string;
  count: number;
  downtimeMinutes: number;
}

export interface MachineDowntimeChartItem {
  machineCode: string;
  machineName: string;
  downtimeMinutes: number;
  count: number;
}

export interface CauseChartItem {
  causeName: string;
  count: number;
  percentage: number;
  downtimeMinutes: number;
}

export interface DashboardCharts {
  stopsByDay: DayChartItem[];
  stopsByPeriod: PeriodChartItem[];
  downtimeByMachine: MachineDowntimeChartItem[];
  stopsByCause: CauseChartItem[];
}

export interface DashboardData {
  kpis: DashboardKPIs;
  machinesStatus: MachineStatusItem[];
  charts: DashboardCharts;
  reliability: ReliabilityIndicators;
  roleScope: string;
}

/**
 * Servicio Central del Dashboard (FASE 8)
 * 
 * Calcula y agrupa:
 * 1. KPIs principales en servidor:
 *    - Tiempo total de paro (minutos y horas)
 *    - Número total de paros
 *    - Máquina con mayor tiempo de paro
 *    - Causa raíz más frecuente
 *    - Paros activos en tiempo real
 *    - Máquinas actualmente detenidas
 *    - Disponibilidad operativa de máquinas
 * 2. Estado de maquinaria con vinculación de paros activos y cronómetro en vivo
 * 3. Conjuntos de datos optimizados para gráficos industriales
 * 
 * Soporta ejecución dual:
 * - PostgreSQL optimizado mediante consultas Prisma
 * - Respaldo en memoria con total consistencia para entornos sin base de datos activa
 */
export async function getDashboardData(
  filters: DashboardFilters,
  session: SessionUser
): Promise<DashboardData> {
  // 1. Validar autenticación
  if (!session) {
    throw new Error("Usuario no autenticado");
  }

  if (session.status !== "ACTIVE") {
    throw new Error("Usuario inactivo o suspendido");
  }

  // 2. Obtener catálogos maestros para referencia de máquinas y áreas
  const catalogs = await getAllCatalogs();
  const allMachines = catalogs.machines || [];

  try {
    // 3. Intento de consulta en base de datos PostgreSQL
    const where: Record<string, unknown> = {
      status: "COMPLETED",
    };

    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.areaId) where.areaId = filters.areaId;
    if (filters.causeId) where.causeId = filters.causeId;
    if (filters.shift) where.shift = filters.shift;

    if (filters.dateFrom || filters.dateTo) {
      where.startTime = {};
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (!isNaN(fromDate.getTime())) {
          (where.startTime as Record<string, unknown>).gte = fromDate;
        }
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        if (!isNaN(toDate.getTime())) {
          if (filters.dateTo.length === 10) toDate.setHours(23, 59, 59, 999);
          (where.startTime as Record<string, unknown>).lte = toDate;
        }
      }
    }

    // RBAC a nivel de servidor
    if (session.role === "OPERADOR") {
      where.operatorId = session.id;
    } else if (session.role === "MANTENIMIENTO") {
      where.AND = [
        {
          OR: [
            { cause: { isRepairable: true } },
            { cause: { name: { contains: "mecánica", mode: "insensitive" } } },
            { cause: { name: { contains: "eléctrica", mode: "insensitive" } } },
            { cause: { name: { contains: "mantenimiento", mode: "insensitive" } } },
            { technicianId: session.id },
            { workOrder: { isNot: null } },
          ],
        },
      ];
    }

    // Consultar paros completados para métricas y gráficos
    const completedStops = await db.stop.findMany({
      where,
      include: {
        machine: { include: { area: true } },
        area: true,
        cause: true,
        stopType: true,
        priority: true,
        operator: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    // Consultar paros activos en tiempo real
    const activeStops = await db.stop.findMany({
      where: { status: "ACTIVE" },
      include: {
        machine: { include: { area: true } },
        area: true,
        cause: true,
        stopType: true,
        priority: true,
        operator: { select: { id: true, name: true } },
      },
    });

    return calculateMetricsFromStops(completedStops, activeStops, allMachines, filters, session.role);
  } catch {
    // 4. Fallback en memoria si PostgreSQL local no está activo
    let completedStops = memoryStops.filter((s) => s.status === "COMPLETED");

    // RBAC
    if (session.role === "OPERADOR") {
      completedStops = completedStops.filter((s) => s.operatorId === session.id);
    } else if (session.role === "MANTENIMIENTO") {
      completedStops = completedStops.filter(
        (s) =>
          s.cause?.isRepairable !== false ||
          s.technicianId === session.id ||
          Boolean(s.workOrder) ||
          (s.cause?.name &&
            (s.cause.name.toLowerCase().includes("mecánica") ||
              s.cause.name.toLowerCase().includes("eléctrica") ||
              s.cause.name.toLowerCase().includes("mantenimiento")))
      );
    }

    // Filtros combinables
    if (filters.machineId) {
      completedStops = completedStops.filter((s) => s.machineId === filters.machineId);
    }
    if (filters.areaId) {
      completedStops = completedStops.filter((s) => s.areaId === filters.areaId);
    }
    if (filters.causeId) {
      completedStops = completedStops.filter((s) => s.causeId === filters.causeId);
    }
    if (filters.shift) {
      completedStops = completedStops.filter((s) => s.shift === filters.shift);
    }
    if (filters.dateFrom) {
      const fromMs = new Date(filters.dateFrom).getTime();
      if (!isNaN(fromMs)) {
        completedStops = completedStops.filter((s) => new Date(s.startTime).getTime() >= fromMs);
      }
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (filters.dateTo.length === 10) to.setHours(23, 59, 59, 999);
      const toMs = to.getTime();
      if (!isNaN(toMs)) {
        completedStops = completedStops.filter((s) => new Date(s.startTime).getTime() <= toMs);
      }
    }

    const activeStops = memoryStops.filter((s) => s.status === "ACTIVE");

    return calculateMetricsFromStops(completedStops, activeStops, allMachines, filters, session.role);
  }
}

interface GenericStopItem {
  id: string;
  machineId?: string;
  machine?: { id?: string; code?: string; name?: string; status?: string; active?: boolean };
  areaId?: string;
  area?: { id?: string; name?: string };
  causeId?: string;
  cause?: { id?: string; name?: string; isRepairable?: boolean };
  stopTypeId?: string;
  stopType?: { id?: string; name?: string };
  priorityId?: string;
  priority?: { id?: string; name?: string; colorCode?: string | null; level?: number };
  operatorId?: string;
  operator?: { id?: string; name?: string; email?: string } | null;
  shift?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration?: number | null;
  observations?: string | null;
  actionTaken?: string | null;
  status: string;
}

interface GenericMachineItem {
  id: string;
  code: string;
  name: string;
  areaId?: string;
  areaName?: string;
  area?: { id?: string; name?: string };
  status: string;
  active?: boolean;
}

/**
 * Motor central de agregación matemática de KPIs y generación de datasets
 */
function calculateMetricsFromStops(
  completedStops: GenericStopItem[],
  activeStops: GenericStopItem[],
  allMachines: GenericMachineItem[],
  filters: DashboardFilters,
  userRole: string
): DashboardData {
  // 1. KPI: Total de tiempo de paro y Total de paros
  let totalDowntimeMinutes = 0;
  for (const s of completedStops) {
    totalDowntimeMinutes += Number(s.duration) || 0;
  }
  const totalStopsCount = completedStops.length;
  const totalDowntimeFormatted = formatDurationMinutes(totalDowntimeMinutes);

  // 2. KPI: Máquina con mayor tiempo de paro
  const machineDowntimeMap = new Map<
    string,
    { id: string; code: string; name: string; minutes: number; count: number }
  >();

  for (const s of completedStops) {
    const mId = s.machineId || s.machine?.id || "unknown";
    const mCode = s.machine?.code || "MAQ";
    const mName = s.machine?.name || "Máquina";
    const dur = Number(s.duration) || 0;

    const current = machineDowntimeMap.get(mId) || {
      id: mId,
      code: mCode,
      name: mName,
      minutes: 0,
      count: 0,
    };
    current.minutes += dur;
    current.count += 1;
    machineDowntimeMap.set(mId, current);
  }

  let topDowntimeMachine: DashboardKPIs["topDowntimeMachine"] = null;
  let maxDowntime = -1;

  for (const item of Array.from(machineDowntimeMap.values())) {
    if (item.minutes > maxDowntime) {
      maxDowntime = item.minutes;
      topDowntimeMachine = {
        id: item.id,
        code: item.code,
        name: item.name,
        minutes: item.minutes,
        formatted: formatDurationMinutes(item.minutes),
      };
    }
  }

  if (!topDowntimeMachine && allMachines.length > 0) {
    topDowntimeMachine = {
      id: "",
      code: "N/A",
      name: "Sin paros en el periodo",
      minutes: 0,
      formatted: "0 min",
    };
  }

  // 3. KPI: Causa más frecuente
  const causeCountMap = new Map<
    string,
    { id: string; name: string; count: number; downtimeMinutes: number }
  >();

  for (const s of completedStops) {
    const cId = s.causeId || s.cause?.id || "unknown";
    const cName = s.cause?.name || "Sin Causa";
    const dur = Number(s.duration) || 0;

    const current = causeCountMap.get(cId) || {
      id: cId,
      name: cName,
      count: 0,
      downtimeMinutes: 0,
    };
    current.count += 1;
    current.downtimeMinutes += dur;
    causeCountMap.set(cId, current);
  }

  let topCause: DashboardKPIs["topCause"] = null;
  let maxCauseCount = -1;

  for (const item of Array.from(causeCountMap.values())) {
    if (item.count > maxCauseCount) {
      maxCauseCount = item.count;
      const percentage = totalStopsCount > 0 ? Math.round((item.count / totalStopsCount) * 100) : 0;
      topCause = {
        id: item.id,
        name: item.name,
        count: item.count,
        percentage,
      };
    }
  }

  if (!topCause) {
    topCause = {
      id: "",
      name: "N/A",
      count: 0,
      percentage: 0,
    };
  }

  // 4. Mapeo de Paros Activos y Máquinas Detenidas
  // Crear mapa de paros activos indexado por machineId
  const activeStopByMachineId = new Map<string, GenericStopItem>();
  for (const act of activeStops) {
    const mId = act.machineId || act.machine?.id;
    if (mId && !activeStopByMachineId.has(mId)) {
      activeStopByMachineId.set(mId, act);
    }
  }

  // Filtrar máquinas según filtros de área o máquina si existen
  let filteredMachines = allMachines.filter((m) => m.active !== false);
  if (filters.areaId) {
    filteredMachines = filteredMachines.filter((m) => m.areaId === filters.areaId);
  }
  if (filters.machineId) {
    filteredMachines = filteredMachines.filter((m) => m.id === filters.machineId);
  }

  let operatingCount = 0;
  let stoppedCount = 0;
  const machinesStatus: MachineStatusItem[] = [];

  for (const m of filteredMachines) {
    const activeStop = activeStopByMachineId.get(m.id);
    let resolvedStatus: "OPERATING" | "STOPPED" | "MAINTENANCE" | "OUT_OF_SERVICE" = "OPERATING";

    if (activeStop) {
      resolvedStatus = "STOPPED";
      stoppedCount += 1;
    } else if (m.status === "MAINTENANCE") {
      resolvedStatus = "MAINTENANCE";
    } else if (m.status === "OUT_OF_SERVICE") {
      resolvedStatus = "OUT_OF_SERVICE";
    } else {
      resolvedStatus = "OPERATING";
      operatingCount += 1;
    }

    const activeStopInfo: ActiveStopInfo | null = activeStop
      ? {
          id: activeStop.id,
          startTime:
            activeStop.startTime instanceof Date
              ? activeStop.startTime.toISOString()
              : String(activeStop.startTime),
          causeName: activeStop.cause?.name || "Sin especificar",
          stopTypeName: activeStop.stopType?.name || "No planeado",
          priorityName: activeStop.priority?.name || "Normal",
          priorityColor: activeStop.priority?.colorCode || "#ef4444",
          operatorName: activeStop.operator?.name || "Operador",
          shift: activeStop.shift || "Matutino",
          observations: activeStop.observations || null,
        }
      : null;

    machinesStatus.push({
      id: m.id,
      code: m.code,
      name: m.name,
      areaId: m.areaId || "",
      areaName: m.area?.name || m.areaName || "Área General",
      status: resolvedStatus,
      active: m.active !== false,
      activeStop: activeStopInfo,
    });
  }

  // Ordenar máquinas: STOPPED primero, luego OPERATING, luego otras
  machinesStatus.sort((a, b) => {
    if (a.status === "STOPPED" && b.status !== "STOPPED") return -1;
    if (b.status === "STOPPED" && a.status !== "STOPPED") return 1;
    return a.code.localeCompare(b.code);
  });

  // 5. KPI: Disponibilidad de máquinas
  // Disponibilidad Operativa = (Máquinas Operando / Total Máquinas Activas) * 100
  const totalActiveMachines = filteredMachines.length;
  const availabilityPercent =
    totalActiveMachines > 0
      ? Math.round((operatingCount / totalActiveMachines) * 1000) / 10
      : 100;

  const activeStopsCount = activeStops.length;

  // 5.1 Cálculo de Indicadores de Confiabilidad y Mantenimiento (FASE 9: MTTR, MTBF, Disponibilidad)
  const reliability = calculateReliabilityMetrics(completedStops, allMachines, filters);

  const kpis: DashboardKPIs = {
    totalDowntimeMinutes,
    totalDowntimeFormatted,
    totalStopsCount,
    topDowntimeMachine,
    topCause,
    activeStopsCount,
    stoppedMachinesCount: stoppedCount,
    totalActiveMachines,
    operatingMachinesCount: operatingCount,
    availabilityPercent,
    // FASE 9: Confiabilidad
    mttrMinutes: reliability.mttrMinutes,
    mttrFormatted: reliability.mttrFormatted,
    mtbfHours: reliability.mtbfHours,
    mtbfFormatted: reliability.mtbfFormatted,
    reliabilityAvailabilityPercent: reliability.availabilityPercent,
    reliabilityAvailabilityFormatted: reliability.availabilityFormatted,
  };

  // 6. Generación de Datasets para Gráficos
  // A. Paros y tiempo de paro por Día (cronológico)
  const dayAggMap = new Map<string, { count: number; downtimeMinutes: number }>();
  for (const s of completedStops) {
    const rawDate = s.startTime instanceof Date ? s.startTime.toISOString() : String(s.startTime);
    const dayStr = rawDate.slice(0, 10);
    const curr = dayAggMap.get(dayStr) || { count: 0, downtimeMinutes: 0 };
    curr.count += 1;
    curr.downtimeMinutes += Number(s.duration) || 0;
    dayAggMap.set(dayStr, curr);
  }

  const sortedDays = Array.from(dayAggMap.keys()).sort();
  const stopsByDay: DayChartItem[] = sortedDays.map((dateStr) => {
    const data = dayAggMap.get(dateStr)!;
    const parts = dateStr.split("-");
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
    return {
      date: dateStr,
      label,
      count: data.count,
      downtimeMinutes: data.downtimeMinutes,
    };
  });

  // B. Paros por Turno / Periodo
  const shiftAggMap = new Map<string, { count: number; downtimeMinutes: number }>();
  const defaultShifts = ["Matutino", "Vespertino", "Nocturno"];
  for (const sh of defaultShifts) {
    shiftAggMap.set(sh, { count: 0, downtimeMinutes: 0 });
  }

  for (const s of completedStops) {
    const sh = s.shift || "Matutino";
    const curr = shiftAggMap.get(sh) || { count: 0, downtimeMinutes: 0 };
    curr.count += 1;
    curr.downtimeMinutes += Number(s.duration) || 0;
    shiftAggMap.set(sh, curr);
  }

  const stopsByPeriod: PeriodChartItem[] = Array.from(shiftAggMap.entries()).map(
    ([period, val]) => ({
      period,
      count: val.count,
      downtimeMinutes: val.downtimeMinutes,
    })
  );

  // C. Tiempo de paro por máquina (ordenado por minutos de paro descendente)
  const downtimeByMachine: MachineDowntimeChartItem[] = Array.from(
    machineDowntimeMap.values()
  )
    .sort((a, b) => b.minutes - a.minutes)
    .map((item) => ({
      machineCode: item.code,
      machineName: item.name,
      downtimeMinutes: item.minutes,
      count: item.count,
    }));

  // D. Distribución de causas raíz
  const stopsByCause: CauseChartItem[] = Array.from(causeCountMap.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      causeName: item.name,
      count: item.count,
      percentage: totalStopsCount > 0 ? Math.round((item.count / totalStopsCount) * 100) : 0,
      downtimeMinutes: item.downtimeMinutes,
    }));

  return {
    kpis,
    machinesStatus,
    charts: {
      stopsByDay,
      stopsByPeriod,
      downtimeByMachine,
      stopsByCause,
    },
    reliability,
    roleScope: userRole,
  };
}
