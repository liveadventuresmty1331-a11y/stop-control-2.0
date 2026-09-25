import { formatDurationMinutes } from "./utils";

export interface ReliabilityStopItem {
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
  technicianId?: string | null;
  shift?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration?: number | null;
  observations?: string | null;
  actionTaken?: string | null;
  status: string;
  workOrder?: { id?: string; code?: string } | null;
}

export interface ReliabilityMachineItem {
  id: string;
  code: string;
  name: string;
  areaId?: string;
  areaName?: string;
  area?: { id?: string; name?: string };
  status: string;
  active?: boolean;
}

export interface ReliabilityFilters {
  dateFrom?: string;
  dateTo?: string;
  machineId?: string;
  areaId?: string;
  causeId?: string;
  shift?: string;
}

export interface MachineReliabilityMetric {
  machineId: string;
  machineCode: string;
  machineName: string;
  areaName: string;
  status: string;
  reparableFailuresCount: number;
  totalRepairMinutes: number;
  mttrMinutes: number | null;
  mttrFormatted: string;
  intervalsCount: number;
  operatingTimeHours: number;
  mtbfHours: number | null;
  mtbfFormatted: string;
  totalDowntimeMinutes: number;
  plannedOperatingMinutes: number;
  operatingMinutes: number;
  availabilityPercent: number | null;
  availabilityFormatted: string;
}

export interface ReliabilityIndicators {
  // MTTR: Mean Time To Repair
  mttrMinutes: number | null;
  mttrHours: number | null;
  mttrFormatted: string;
  totalRepairMinutes: number;
  reparableFailuresCount: number;

  // MTBF: Mean Time Between Failures
  mtbfHours: number | null;
  mtbfFormatted: string;
  totalOperatingHoursBetweenFailures: number;
  totalIntervalsCount: number;
  eligibleMachinesCount: number;

  // Disponibilidad Operativa (Operational Availability)
  availabilityPercent: number | null;
  availabilityFormatted: string;
  totalPlannedOperatingMinutes: number;
  totalActualOperatingMinutes: number;
  totalDowntimeMinutes: number;

  // Contexto y Periodo
  analyzedDays: number;
  periodLabel: string;
  selectedMachineCode: string | null;

  // Desglose individual por máquina (para comparativas)
  byMachine: MachineReliabilityMetric[];

  // Metadatos y documentación técnica de los criterios aplicados
  criteriaNotes: {
    reparableCriteria: string;
    mttrFormula: string;
    mtbfFormula: string;
    availabilityFormula: string;
  };
}

/**
 * Criterio centralizado para determinar si un evento de paro clasifica como falla técnica reparable (FASE 9).
 * 
 * Reglas de inclusión:
 * - Paro en estado COMPLETED (los paros ACTIVE no tienen duración final calculada).
 * - Duración registrada válida > 0 minutos.
 * - Tipo de paro No planeado (los paros planeados nunca representan fallas imprevistas).
 * - Causa raíz reparable:
 *   * cause.isRepairable === true, O
 *   * Causas con términos técnicos explícitos ("falla mecánica", "falla eléctrica", "avería"), O
 *   * Paros que requirieron orden de trabajo (WorkOrder) o intervención documentada de técnico de mantenimiento.
 * 
 * Reglas de exclusión:
 * - Paros planeados (mantenimiento preventivo programado, inspecciones agendadas).
 * - "Falta de material" (paro logístico/operativo, no falla del equipo).
 * - "Ajuste" (setups rutinarios o cambios de formato sin rotura).
 * - "Error humano" / demoras administrativas (no inherentes a la confiabilidad intrínseca del activo).
 */
export function isRepairableStop(stop: ReliabilityStopItem): boolean {
  if (stop.status !== "COMPLETED") return false;

  const duration = Number(stop.duration);
  if (isNaN(duration) || duration <= 0) return false;

  // 1. Tipo de paro: Rechazar paros planeados
  const typeName = stop.stopType?.name?.toLowerCase().trim() || "";
  if (typeName === "planeado") {
    return false;
  }

  // 2. Causa raíz: Análisis de causas excluidas
  const causeName = stop.cause?.name?.toLowerCase().trim() || "";
  if (
    causeName.includes("falta de material") ||
    causeName.includes("espera administrativa") ||
    causeName === "ajuste"
  ) {
    return false;
  }

  // 3. Causas reparables admitidas
  if (stop.cause?.isRepairable === true) {
    return true;
  }

  if (
    causeName.includes("falla mecánica") ||
    causeName.includes("falla electrica") ||
    causeName.includes("falla eléctrica") ||
    causeName.includes("avería") ||
    causeName.includes("reparación")
  ) {
    return true;
  }

  // 4. Intervención técnica registrada con orden de trabajo
  if (stop.workOrder && Boolean(stop.workOrder.code)) {
    return true;
  }

  return false;
}

/**
 * Formatea un valor de horas para presentación industrial (ej. "23.3 h", "1.5 h")
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || isNaN(hours) || !isFinite(hours) || hours < 0) {
    return "Sin datos suficientes";
  }
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h`;
}

/**
 * Servicio Central de Confiabilidad y Mantenimiento: MTTR, MTBF y Disponibilidad (FASE 9)
 * 
 * @param allStops Lista de todos los paros que coinciden con los filtros base (de DB o memoria)
 * @param machines Lista de máquinas activas a evaluar
 * @param filters Filtros aplicados en la consulta
 */
export function calculateReliabilityMetrics(
  allStops: ReliabilityStopItem[],
  machines: ReliabilityMachineItem[],
  filters: ReliabilityFilters
): ReliabilityIndicators {
  // 1. Determinar el periodo analizado en días
  let analyzedDays = 7; // Referencia industrial por defecto (última semana)
  let periodLabel = "Últimos 7 días (operación 24h)";

  if (filters.dateFrom && filters.dateTo) {
    const fromMs = new Date(filters.dateFrom).getTime();
    const toDate = new Date(filters.dateTo);
    if (filters.dateTo.length === 10) toDate.setHours(23, 59, 59, 999);
    const toMs = toDate.getTime();

    if (!isNaN(fromMs) && !isNaN(toMs) && toMs >= fromMs) {
      const diffDays = Math.ceil((toMs - fromMs) / (1000 * 3600 * 24));
      analyzedDays = Math.max(1, diffDays);
      periodLabel = `${filters.dateFrom} a ${filters.dateTo} (${analyzedDays} día${analyzedDays === 1 ? "" : "s"})`;
    }
  } else if (filters.dateFrom) {
    const fromMs = new Date(filters.dateFrom).getTime();
    const nowMs = Date.now();
    if (!isNaN(fromMs) && nowMs >= fromMs) {
      analyzedDays = Math.max(1, Math.ceil((nowMs - fromMs) / (1000 * 3600 * 24)));
      periodLabel = `Desde ${filters.dateFrom} (${analyzedDays} días)`;
    }
  }

  // Filtrar máquinas activas
  let targetMachines = machines.filter((m) => m.active !== false);
  let selectedMachineCode: string | null = null;

  if (filters.machineId) {
    targetMachines = targetMachines.filter((m) => m.id === filters.machineId);
    if (targetMachines.length > 0) {
      selectedMachineCode = targetMachines[0].code;
    }
  }

  if (filters.areaId) {
    targetMachines = targetMachines.filter((m) => m.areaId === filters.areaId);
  }

  // Considerar solo paros completados para confiabilidad histórica
  const completedStops = allStops.filter((s) => s.status === "COMPLETED");

  // 2. Cálculos por máquina individual
  const byMachine: MachineReliabilityMetric[] = [];

  let plantTotalRepairMinutes = 0;
  let plantTotalReparableFailures = 0;
  let plantTotalOperatingHoursBetweenFailures = 0;
  let plantTotalIntervalsCount = 0;
  let eligibleMachinesForMtbfCount = 0;

  let plantTotalDowntimeMinutes = 0;
  let plantTotalPlannedOperatingMinutes = 0;

  for (const mach of targetMachines) {
    const machineStops = completedStops.filter(
      (s) => (s.machineId || s.machine?.id) === mach.id
    );

    // Suma de tiempo de inactividad de todos los paros de la máquina
    const totalDowntimeMinutes = machineStops.reduce(
      (acc, s) => acc + (Number(s.duration) || 0),
      0
    );

    // Paros reparables de esta máquina
    const reparableStops = machineStops.filter(isRepairableStop);

    // A. MTTR de la máquina
    const reparableCount = reparableStops.length;
    const totalRepairMinutes = reparableStops.reduce(
      (acc, s) => acc + (Number(s.duration) || 0),
      0
    );

    let mttrMinutes: number | null = null;
    let mttrFormatted = "Sin fallas registradas";

    if (reparableCount > 0) {
      mttrMinutes = Math.round((totalRepairMinutes / reparableCount) * 10) / 10;
      mttrFormatted = formatDurationMinutes(Math.round(mttrMinutes));
    }

    // B. MTBF de la máquina (respetando orden cronológico e intervalos entre fallas)
    // Ordenar fallas reparables cronológicamente por startTime ascendente
    reparableStops.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });

    let intervalsCount = 0;
    let operatingTimeBetweenFailuresMs = 0;

    if (reparableStops.length >= 2) {
      for (let i = 0; i < reparableStops.length - 1; i++) {
        const currentFailure = reparableStops[i];
        const nextFailure = reparableStops[i + 1];

        const endCurrentMs = currentFailure.endTime
          ? new Date(currentFailure.endTime).getTime()
          : new Date(currentFailure.startTime).getTime() + (Number(currentFailure.duration) || 0) * 60000;

        const startNextMs = new Date(nextFailure.startTime).getTime();

        // Tiempo transcurrido entre el fin de la reparación anterior y el inicio de la siguiente falla
        if (startNextMs > endCurrentMs) {
          let intervalUptimeMs = startNextMs - endCurrentMs;

          // Descontar otros paros no reparables ocurridos estrictamente dentro de este intervalo
          const intermediateStops = machineStops.filter((other) => {
            if (other.id === currentFailure.id || other.id === nextFailure.id) return false;
            const otherStart = new Date(other.startTime).getTime();
            return otherStart >= endCurrentMs && otherStart < startNextMs;
          });

          for (const inter of intermediateStops) {
            const durMs = (Number(inter.duration) || 0) * 60000;
            intervalUptimeMs = Math.max(0, intervalUptimeMs - durMs);
          }

          operatingTimeBetweenFailuresMs += intervalUptimeMs;
          intervalsCount += 1;
        }
      }
    }

    const operatingTimeHours = Math.round((operatingTimeBetweenFailuresMs / (1000 * 3600)) * 10) / 10;

    let mtbfHours: number | null = null;
    let mtbfFormatted = "Sin datos suficientes";

    if (intervalsCount > 0) {
      mtbfHours = Math.round((operatingTimeHours / intervalsCount) * 10) / 10;
      mtbfFormatted = formatHours(mtbfHours);
      eligibleMachinesForMtbfCount += 1;
    } else if (reparableCount === 1) {
      mtbfFormatted = "Sin datos suficientes (mín. 2 fallas)";
    } else {
      mtbfFormatted = "Sin fallas registradas";
    }

    // C. Disponibilidad de la máquina
    // Operación continua planificada: 24 horas al día = 1440 min/día
    const plannedOperatingMinutes = analyzedDays * 24 * 60;
    const operatingMinutes = Math.max(0, plannedOperatingMinutes - totalDowntimeMinutes);
    const availabilityPercent =
      plannedOperatingMinutes > 0
        ? Math.round((operatingMinutes / plannedOperatingMinutes) * 1000) / 10
        : 100;
    const availabilityFormatted = `${availabilityPercent.toFixed(1)}%`;

    // Acumuladores globales para el cálculo agregado
    plantTotalRepairMinutes += totalRepairMinutes;
    plantTotalReparableFailures += reparableCount;
    plantTotalOperatingHoursBetweenFailures += operatingTimeHours;
    plantTotalIntervalsCount += intervalsCount;
    plantTotalDowntimeMinutes += totalDowntimeMinutes;
    plantTotalPlannedOperatingMinutes += plannedOperatingMinutes;

    byMachine.push({
      machineId: mach.id,
      machineCode: mach.code,
      machineName: mach.name,
      areaName: mach.area?.name || mach.areaName || "General",
      status: mach.status,
      reparableFailuresCount: reparableCount,
      totalRepairMinutes,
      mttrMinutes,
      mttrFormatted,
      intervalsCount,
      operatingTimeHours,
      mtbfHours,
      mtbfFormatted,
      totalDowntimeMinutes,
      plannedOperatingMinutes,
      operatingMinutes,
      availabilityPercent,
      availabilityFormatted,
    });
  }

  // Ordenar máquinas por código alfabéticamente
  byMachine.sort((a, b) => a.machineCode.localeCompare(b.machineCode));

  // 3. Indicadores Globales Agregados (Planta o Selección)
  // A. MTTR Global
  let globalMttrMinutes: number | null = null;
  let globalMttrHours: number | null = null;
  let globalMttrFormatted = "Sin fallas registradas";

  if (plantTotalReparableFailures > 0) {
    globalMttrMinutes =
      Math.round((plantTotalRepairMinutes / plantTotalReparableFailures) * 10) / 10;
    globalMttrHours = Math.round((globalMttrMinutes / 60) * 10) / 10;
    globalMttrFormatted = formatDurationMinutes(Math.round(globalMttrMinutes));
  }

  // B. MTBF Global
  // Suma de tiempos operativos entre fallas / suma de intervalos válidos
  let globalMtbfHours: number | null = null;
  let globalMtbfFormatted = "Sin datos suficientes";

  if (plantTotalIntervalsCount > 0) {
    globalMtbfHours =
      Math.round((plantTotalOperatingHoursBetweenFailures / plantTotalIntervalsCount) * 10) / 10;
    globalMtbfFormatted = formatHours(globalMtbfHours);
  } else if (plantTotalReparableFailures === 1) {
    globalMtbfFormatted = "Sin datos suficientes (mín. 2 fallas)";
  } else if (plantTotalReparableFailures === 0) {
    globalMtbfFormatted = "Sin fallas registradas";
  }

  // C. Disponibilidad Global
  const totalActualOperatingMinutes = Math.max(
    0,
    plantTotalPlannedOperatingMinutes - plantTotalDowntimeMinutes
  );
  const globalAvailabilityPercent =
    plantTotalPlannedOperatingMinutes > 0
      ? Math.round((totalActualOperatingMinutes / plantTotalPlannedOperatingMinutes) * 1000) / 10
      : 100;
  const globalAvailabilityFormatted = `${globalAvailabilityPercent.toFixed(1)}%`;

  return {
    mttrMinutes: globalMttrMinutes,
    mttrHours: globalMttrHours,
    mttrFormatted: globalMttrFormatted,
    totalRepairMinutes: plantTotalRepairMinutes,
    reparableFailuresCount: plantTotalReparableFailures,

    mtbfHours: globalMtbfHours,
    mtbfFormatted: globalMtbfFormatted,
    totalOperatingHoursBetweenFailures: Math.round(plantTotalOperatingHoursBetweenFailures * 10) / 10,
    totalIntervalsCount: plantTotalIntervalsCount,
    eligibleMachinesCount: eligibleMachinesForMtbfCount,

    availabilityPercent: globalAvailabilityPercent,
    availabilityFormatted: globalAvailabilityFormatted,
    totalPlannedOperatingMinutes: plantTotalPlannedOperatingMinutes,
    totalActualOperatingMinutes,
    totalDowntimeMinutes: plantTotalDowntimeMinutes,

    analyzedDays,
    periodLabel,
    selectedMachineCode,

    byMachine,

    criteriaNotes: {
      reparableCriteria:
        "Filtro centralizado: Paros COMPLETED, tipo 'No planeado', con causas de falla mecánica, falla eléctrica o con orden técnica de reparación. Se excluyen paros planeados, falta de material y esperas de operador.",
      mttrFormula:
        "MTTR = Tiempo total de reparación / Número de fallas reparables (en minutos/horas).",
      mtbfFormula:
        "MTBF = Tiempo operativo entre fallas consecutivas / Número de intervalos entre fallas por máquina.",
      availabilityFormula:
        "Disponibilidad = (Tiempo operativo / Tiempo planificado de operación [24h/día]) × 100.",
    },
  };
}
