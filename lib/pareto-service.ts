import { formatDurationMinutes } from "./utils";

export interface RawParetoInput {
  id: string;
  code?: string;
  name: string;
  value: number;
}

export interface ParetoItem {
  id: string;
  code?: string;
  name: string;
  value: number;
  formattedValue: string;
  percentage: number;
  cumulativePercentage: number;
  isVitalFew: boolean; // Indica si pertenece a los "pocos vitales" que acumulan hasta el ~80%
  rank: number;
}

export interface ParetoAnalysisResult {
  analysisType: "CAUSES_FREQUENCY" | "MACHINES_FREQUENCY" | "MACHINES_DOWNTIME";
  title: string;
  subtitle: string;
  unitLabel: string;
  totalValue: number;
  formattedTotal: string;
  itemsCount: number;
  vitalFewCount: number;
  thresholdPercentage: number; // 80%
  items: ParetoItem[];
  isEmpty: boolean;
}

export interface ParetoDashboardDatasets {
  causesByFrequency: ParetoAnalysisResult;
  machinesByFrequency: ParetoAnalysisResult;
  machinesByDowntime: ParetoAnalysisResult;
}

export interface GenericStopForPareto {
  id: string;
  machineId?: string;
  machine?: { id?: string; code?: string; name?: string };
  causeId?: string;
  cause?: { id?: string; name?: string };
  duration?: number | null;
  status: string;
}

export interface GenericMachineForPareto {
  id: string;
  code: string;
  name: string;
  active?: boolean;
}

/**
 * Motor central de cálculo del Diagrama de Pareto (Principio 80/20) - FASE 10
 * 
 * Reglas de cálculo matemático:
 * 1. Ordenamiento estrictamente descendente según el valor de impacto.
 * 2. Cálculo del total absoluto de la métrica (conteo de eventos o minutos).
 * 3. Cálculo del porcentaje individual: (valor / total) * 100.
 * 4. Cálculo del porcentaje acumulado sumando progresivamente. El último elemento siempre es exactamente 100.0%.
 * 5. Identificación de los "Pocos Vitales" (Vital Few): Todos los elementos que acumulan hasta alcanzar o cruzar el umbral del 80%.
 * 6. Protección absoluta contra división por cero, NaN o Infinity.
 */
export interface ParetoCalculationOptions {
  analysisType: "CAUSES_FREQUENCY" | "MACHINES_FREQUENCY" | "MACHINES_DOWNTIME";
  unitLabel?: string;
  title?: string;
  subtitle?: string;
}

export function calculatePareto(
  rawItems: RawParetoInput[],
  optionsOrType:
    | ParetoCalculationOptions
    | "CAUSES_FREQUENCY"
    | "MACHINES_FREQUENCY"
    | "MACHINES_DOWNTIME",
  unitLabelArg?: string,
  titleArg?: string,
  subtitleArg?: string
): ParetoAnalysisResult {
  let analysisType: "CAUSES_FREQUENCY" | "MACHINES_FREQUENCY" | "MACHINES_DOWNTIME";
  let unitLabel: string;
  let title: string;
  let subtitle: string;

  if (typeof optionsOrType === "object" && optionsOrType !== null) {
    analysisType = optionsOrType.analysisType;
    unitLabel =
      optionsOrType.unitLabel ||
      (analysisType === "MACHINES_DOWNTIME" ? "minutos" : "paros");
    title = optionsOrType.title || "";
    subtitle = optionsOrType.subtitle || "";
  } else {
    analysisType = optionsOrType;
    unitLabel =
      unitLabelArg ||
      (analysisType === "MACHINES_DOWNTIME" ? "minutos" : "paros");
    title = titleArg || "";
    subtitle = subtitleArg || "";
  }

  // 1. Filtrar elementos con valores no positivos o inválidos
  const validItems = rawItems
    .map((item) => ({
      ...item,
      value: Number(item.value) || 0,
    }))
    .filter((item) => item.value > 0);

  // 2. Si no hay elementos con impacto en el periodo
  if (validItems.length === 0) {
    return {
      analysisType,
      title,
      subtitle,
      unitLabel,
      totalValue: 0,
      formattedTotal: analysisType === "MACHINES_DOWNTIME" ? "0 min" : "0 eventos",
      itemsCount: 0,
      vitalFewCount: 0,
      thresholdPercentage: 80,
      items: [],
      isEmpty: true,
    };
  }

  // 3. Ordenar descendentemente por valor (impacto)
  validItems.sort((a, b) => b.value - a.value);

  // 4. Calcular el total acumulado absoluto
  const totalValue = validItems.reduce((acc, curr) => acc + curr.value, 0);

  if (totalValue <= 0) {
    return {
      analysisType,
      title,
      subtitle,
      unitLabel,
      totalValue: 0,
      formattedTotal: "0",
      itemsCount: 0,
      vitalFewCount: 0,
      thresholdPercentage: 80,
      items: [],
      isEmpty: true,
    };
  }

  // 5. Calcular porcentajes individuales y acumulados
  let runningCumulative = 0;
  let vitalFewCount = 0;
  let crossedThreshold = false;

  const items: ParetoItem[] = validItems.map((item, index) => {
    const rawPercentage = (item.value / totalValue) * 100;
    const percentage = Math.round(rawPercentage * 10) / 10;

    runningCumulative += item.value;
    let cumulativePercentage: number;

    // Si es el último elemento, asegurar exactamente 100.0% para evitar errores de coma flotante (ej. 99.9% o 100.1%)
    if (index === validItems.length - 1) {
      cumulativePercentage = 100.0;
    } else {
      cumulativePercentage = Math.round(((runningCumulative / totalValue) * 100) * 10) / 10;
    }

    // Regla del 80%: Los pocos vitales incluyen todos los ítems hasta cruzar o alcanzar el 80%
    let isVitalFew = false;
    if (!crossedThreshold) {
      isVitalFew = true;
      vitalFewCount++;
      if (cumulativePercentage >= 80.0) {
        crossedThreshold = true;
      }
    }

    // Formateo del valor según el tipo de análisis
    let formattedValue = `${item.value} ${unitLabel}`;
    if (analysisType === "MACHINES_DOWNTIME") {
      formattedValue = `${formatDurationMinutes(item.value)} (${item.value} min)`;
    } else if (item.value === 1) {
      formattedValue = `1 paro`;
    } else {
      formattedValue = `${item.value} paros`;
    }

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      value: item.value,
      formattedValue,
      percentage,
      cumulativePercentage,
      isVitalFew,
      rank: index + 1,
    };
  });

  const formattedTotal =
    analysisType === "MACHINES_DOWNTIME"
      ? `${formatDurationMinutes(totalValue)} (${totalValue} min)`
      : `${totalValue} ${unitLabel}`;

  return {
    analysisType,
    title,
    subtitle,
    unitLabel,
    totalValue,
    formattedTotal,
    itemsCount: items.length,
    vitalFewCount,
    thresholdPercentage: 80,
    items,
    isEmpty: false,
  };
}

/**
 * Genera los 3 análisis de Pareto exigidos por la FASE 10 a partir de paros completados y máquinas:
 * 1. Pareto de causas (por frecuencia de ocurrencia)
 * 2. Pareto de máquinas por frecuencia (conteo de eventos de paro)
 * 3. Pareto de máquinas por tiempo de paro (minutos acumulados de inactividad)
 * 
 * Regla de Oro: Se separan claramente frecuencia y tiempo de paro para no mezclar métricas sin explicación.
 */
export function generateDashboardPareto(
  completedStops: GenericStopForPareto[],
  allMachines: GenericMachineForPareto[]
): ParetoDashboardDatasets {
  // Asegurar que solo paros COMPLETED sean analizados
  const validStops = completedStops.filter((s) => s.status === "COMPLETED");

  // ----------------------------------------------------
  // 1. Pareto de Causas por Frecuencia
  // ----------------------------------------------------
  const causeCountMap = new Map<string, { id: string; name: string; count: number }>();

  for (const s of validStops) {
    const cId = s.causeId || s.cause?.id || "unknown";
    const cName = s.cause?.name || "Sin Causa";
    const curr = causeCountMap.get(cId) || { id: cId, name: cName, count: 0 };
    curr.count += 1;
    causeCountMap.set(cId, curr);
  }

  const rawCauses: RawParetoInput[] = Array.from(causeCountMap.values()).map((c) => ({
    id: c.id,
    name: c.name,
    value: c.count,
  }));

  const causesByFrequency = calculatePareto(
    rawCauses,
    "CAUSES_FREQUENCY",
    "paros",
    "Pareto de Causas de Paro (80/20)",
    "Identifica las causas raíz que concentran el mayor número de interrupciones en planta"
  );

  // ----------------------------------------------------
  // 2. Pareto de Máquinas por Frecuencia (Eventos)
  // ----------------------------------------------------
  const machineFreqMap = new Map<
    string,
    { id: string; code: string; name: string; count: number }
  >();

  // Inicializar máquinas de catálogo para que tengan presencia en el mapeo si fallaron
  for (const m of allMachines) {
    machineFreqMap.set(m.id, { id: m.id, code: m.code, name: m.name, count: 0 });
  }

  for (const s of validStops) {
    const mId = s.machineId || s.machine?.id;
    if (!mId) continue;
    const curr = machineFreqMap.get(mId) || {
      id: mId,
      code: s.machine?.code || "MAQ",
      name: s.machine?.name || "Máquina",
      count: 0,
    };
    curr.count += 1;
    machineFreqMap.set(mId, curr);
  }

  const rawMachinesFreq: RawParetoInput[] = Array.from(machineFreqMap.values())
    .filter((m) => m.count > 0)
    .map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      value: m.count,
    }));

  const machinesByFrequency = calculatePareto(
    rawMachinesFreq,
    "MACHINES_FREQUENCY",
    "paros",
    "Pareto de Máquinas por Frecuencia de Paros",
    "Identifica los equipos que sufren interrupciones con mayor frecuencia (paros reiterados)"
  );

  // ----------------------------------------------------
  // 3. Pareto de Máquinas por Tiempo Total de Paro (Duración en minutos)
  // ----------------------------------------------------
  const machineDowntimeMap = new Map<
    string,
    { id: string; code: string; name: string; minutes: number }
  >();

  for (const m of allMachines) {
    machineDowntimeMap.set(m.id, { id: m.id, code: m.code, name: m.name, minutes: 0 });
  }

  for (const s of validStops) {
    const mId = s.machineId || s.machine?.id;
    if (!mId) continue;
    const dur = Number(s.duration) || 0;
    const curr = machineDowntimeMap.get(mId) || {
      id: mId,
      code: s.machine?.code || "MAQ",
      name: s.machine?.name || "Máquina",
      minutes: 0,
    };
    curr.minutes += dur;
    machineDowntimeMap.set(mId, curr);
  }

  const rawMachinesDowntime: RawParetoInput[] = Array.from(machineDowntimeMap.values())
    .filter((m) => m.minutes > 0)
    .map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      value: m.minutes,
    }));

  const machinesByDowntime = calculatePareto(
    rawMachinesDowntime,
    "MACHINES_DOWNTIME",
    "minutos",
    "Pareto de Máquinas por Tiempo de Inactividad",
    "Identifica los equipos que generan las mayores pérdidas de tiempo productivo acumulado"
  );

  return {
    causesByFrequency,
    machinesByFrequency,
    machinesByDowntime,
  };
}
