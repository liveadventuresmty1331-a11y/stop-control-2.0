import {
  isRepairableStop,
  calculateReliabilityMetrics,
  formatHours,
  ReliabilityStopItem,
  ReliabilityMachineItem,
} from "../lib/reliability-service";
import { getDashboardData } from "../lib/dashboard-service";
import { SessionUser } from "../lib/auth";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    process.exitCode = 1;
  }
}

async function runReliabilityTests() {
  console.log("==========================================");
  console.log("INICIANDO SUITE DE PRUEBAS: FASE 9 - MTTR, MTBF Y DISPONIBILIDAD");
  console.log("==========================================\n");

  const adminUser: SessionUser = {
    id: "user-1",
    name: "Carlos Mendoza (Admin)",
    email: "admin@stopcontrol.local",
    role: "ADMINISTRADOR",
    status: "ACTIVE",
  };

  // ----------------------------------------------------
  // 1. Criterio centralizado de fallas reparables (isRepairableStop)
  // ----------------------------------------------------
  console.log("1. Pruebas del Criterio Centralizado de Fallas Reparables:");

  const testRepairableMechanical: ReliabilityStopItem = {
    id: "test-rep-1",
    status: "COMPLETED",
    duration: 50,
    startTime: "2026-09-20T10:00:00Z",
    endTime: "2026-09-20T10:50:00Z",
    stopType: { name: "No planeado" },
    cause: { name: "Falla mecánica", isRepairable: true },
  };
  assert(
    isRepairableStop(testRepairableMechanical) === true,
    "Paro no planeado por Falla mecánica clasifica como falla reparable"
  );

  const testRepairableElectrical: ReliabilityStopItem = {
    id: "test-rep-2",
    status: "COMPLETED",
    duration: 35,
    startTime: "2026-09-21T08:00:00Z",
    endTime: "2026-09-21T08:35:00Z",
    stopType: { name: "No planeado" },
    cause: { name: "Falla eléctrica", isRepairable: true },
  };
  assert(
    isRepairableStop(testRepairableElectrical) === true,
    "Paro no planeado por Falla eléctrica clasifica como falla reparable"
  );

  const testExclusionPlanned: ReliabilityStopItem = {
    id: "test-ex-1",
    status: "COMPLETED",
    duration: 40,
    startTime: "2026-09-21T12:00:00Z",
    endTime: "2026-09-21T12:40:00Z",
    stopType: { name: "Planeado" },
    cause: { name: "Mantenimiento preventivo", isRepairable: false },
  };
  assert(
    isRepairableStop(testExclusionPlanned) === false,
    "Paro de tipo Planeado se EXCLUYE de fallas reparables"
  );

  const testExclusionMaterial: ReliabilityStopItem = {
    id: "test-ex-2",
    status: "COMPLETED",
    duration: 60,
    startTime: "2026-09-22T14:00:00Z",
    endTime: "2026-09-22T15:00:00Z",
    stopType: { name: "No planeado" },
    cause: { name: "Falta de material", isRepairable: false },
  };
  assert(
    isRepairableStop(testExclusionMaterial) === false,
    "Paro por Falta de material se EXCLUYE de fallas reparables (problema logístico, no de máquina)"
  );

  const testExclusionActive: ReliabilityStopItem = {
    id: "test-ex-3",
    status: "ACTIVE", // En curso
    duration: null,
    startTime: "2026-09-25T08:00:00Z",
    endTime: null,
    stopType: { name: "No planeado" },
    cause: { name: "Falla mecánica", isRepairable: true },
  };
  assert(
    isRepairableStop(testExclusionActive) === false,
    "Paro en estado ACTIVE se EXCLUYE hasta que sea COMPLETED y tenga duración final"
  );

  const testExclusionZeroDuration: ReliabilityStopItem = {
    id: "test-ex-4",
    status: "COMPLETED",
    duration: 0,
    startTime: "2026-09-22T10:00:00Z",
    endTime: "2026-09-22T10:00:00Z",
    stopType: { name: "No planeado" },
    cause: { name: "Falla mecánica", isRepairable: true },
  };
  assert(
    isRepairableStop(testExclusionZeroDuration) === false,
    "Paro con duración 0 se EXCLUYE para evitar distorsiones estadísticas"
  );

  const testInclusionWorkOrder: ReliabilityStopItem = {
    id: "test-inc-wo",
    status: "COMPLETED",
    duration: 75,
    startTime: "2026-09-23T11:00:00Z",
    endTime: "2026-09-23T12:15:00Z",
    stopType: { name: "No planeado" },
    cause: { name: "Calidad", isRepairable: false },
    workOrder: { id: "wo-99", code: "OT-2026-0099" },
  };
  assert(
    isRepairableStop(testInclusionWorkOrder) === true,
    "Paro no planeado con Orden de Trabajo (OT) se incluye como intervención técnica reparable"
  );

  // ----------------------------------------------------
  // 2. Cálculo formal de MTTR (Mean Time To Repair)
  // ----------------------------------------------------
  console.log("\n2. Pruebas de Cálculo Matemático de MTTR:");

  const sampleMachines: ReliabilityMachineItem[] = [
    { id: "m-1", code: "CNC-01", name: "Torno CNC", status: "OPERATING", active: true },
    { id: "m-2", code: "CNC-02", name: "Torno CNC", status: "OPERATING", active: true },
    { id: "m-3", code: "SOLD-01", name: "Soldadora", status: "OPERATING", active: true },
  ];

  // CNC-01 tiene 2 fallas: 40 min y 60 min. Total = 100 min. MTTR = 50 min.
  const sampleStops: ReliabilityStopItem[] = [
    {
      id: "s-1",
      machineId: "m-1",
      status: "COMPLETED",
      duration: 40,
      startTime: "2026-09-20T08:00:00Z",
      endTime: "2026-09-20T08:40:00Z",
      stopType: { name: "No planeado" },
      cause: { name: "Falla mecánica", isRepairable: true },
    },
    {
      id: "s-2",
      machineId: "m-1",
      status: "COMPLETED",
      duration: 60,
      startTime: "2026-09-22T10:00:00Z",
      endTime: "2026-09-22T11:00:00Z",
      stopType: { name: "No planeado" },
      cause: { name: "Falla mecánica", isRepairable: true },
    },
    // SOLD-01 tiene 1 falla: 30 min.
    {
      id: "s-3",
      machineId: "m-3",
      status: "COMPLETED",
      duration: 30,
      startTime: "2026-09-21T09:00:00Z",
      endTime: "2026-09-21T09:30:00Z",
      stopType: { name: "No planeado" },
      cause: { name: "Falla eléctrica", isRepairable: true },
    },
    // Paro planeado en CNC-02: 15 min (no debe contar en MTTR)
    {
      id: "s-4",
      machineId: "m-2",
      status: "COMPLETED",
      duration: 15,
      startTime: "2026-09-21T12:00:00Z",
      endTime: "2026-09-21T12:15:00Z",
      stopType: { name: "Planeado" },
      cause: { name: "Ajuste", isRepairable: false },
    },
  ];

  const metrics = calculateReliabilityMetrics(sampleStops, sampleMachines, {
    dateFrom: "2026-09-20",
    dateTo: "2026-09-23",
  });

  const cnc01Metric = metrics.byMachine.find((m) => m.machineCode === "CNC-01")!;
  assert(
    cnc01Metric.reparableFailuresCount === 2 && cnc01Metric.totalRepairMinutes === 100,
    "CNC-01 registra exactamente 2 fallas reparables con 100 min totales de reparación"
  );
  assert(
    cnc01Metric.mttrMinutes === 50 && cnc01Metric.mttrFormatted === "50 min",
    `MTTR de CNC-01 calculado con precisión matemática: 100 min / 2 fallas = ${cnc01Metric.mttrFormatted}`
  );

  const sold01Metric = metrics.byMachine.find((m) => m.machineCode === "SOLD-01")!;
  assert(
    sold01Metric.mttrMinutes === 30 && sold01Metric.mttrFormatted === "30 min",
    "MTTR de SOLD-01 con 1 falla = duración de esa falla (30 min)"
  );

  const cnc02Metric = metrics.byMachine.find((m) => m.machineCode === "CNC-02")!;
  assert(
    cnc02Metric.reparableFailuresCount === 0 && cnc02Metric.mttrMinutes === null,
    "Máquina sin fallas reparables (CNC-02) tiene MTTR nulo y no distorsiona promedios"
  );

  // MTTR Global de planta: (100 + 30) / 3 fallas = 43.3 min
  assert(
    metrics.reparableFailuresCount === 3 &&
      metrics.totalRepairMinutes === 130 &&
      metrics.mttrMinutes === 43.3,
    `MTTR Global de planta = 130 min / 3 fallas = ${metrics.mttrMinutes} min (${metrics.mttrFormatted})`
  );

  // ----------------------------------------------------
  // 3. Cálculo formal de MTBF (Mean Time Between Failures)
  // ----------------------------------------------------
  console.log("\n3. Pruebas de Cálculo de MTBF (Orden Cronológico e Intervalos):");

  // En CNC-01:
  // Falla 1 terminó: 2026-09-20T08:40:00Z
  // Falla 2 inició:  2026-09-22T10:00:00Z
  // Diferencia de tiempo: 49 horas y 20 minutos = 49.333 horas
  // 1 intervalo entre fallas = 49.3 horas operativas
  assert(
    cnc01Metric.intervalsCount === 1,
    "CNC-01 con 2 fallas consecutivas genera exactamente 1 intervalo entre fallas"
  );
  assert(
    cnc01Metric.mtbfHours !== null && cnc01Metric.mtbfHours >= 49 && cnc01Metric.mtbfHours <= 50,
    `MTBF de CNC-01 calculado respetando el orden cronológico: ${cnc01Metric.mtbfFormatted}`
  );

  // SOLD-01 tiene 1 sola falla: no hay intervalo entre fallas
  assert(
    sold01Metric.intervalsCount === 0 &&
      sold01Metric.mtbfHours === null &&
      sold01Metric.mtbfFormatted.includes("mín. 2 fallas"),
    "SOLD-01 con 1 sola falla reporta adecuadamente 'Sin datos suficientes (mín. 2 fallas)'"
  );

  // CNC-02 tiene 0 fallas:
  assert(
    cnc02Metric.intervalsCount === 0 &&
      cnc02Metric.mtbfHours === null &&
      cnc02Metric.mtbfFormatted.includes("Sin fallas"),
    "CNC-02 con 0 fallas reporta adecuadamente 'Sin fallas registradas'"
  );

  // ----------------------------------------------------
  // 4. Cálculo de Disponibilidad Operativa (Base 24 horas)
  // ----------------------------------------------------
  console.log("\n4. Pruebas de Cálculo de Disponibilidad Operativa:");

  // Periodo: 2026-09-20 a 2026-09-23 = 4 días
  // Horas planificadas por máquina = 4 días * 24 horas = 96 horas = 5,760 min
  assert(
    cnc01Metric.plannedOperatingMinutes === 4 * 24 * 60,
    `Tiempo planificado por máquina = 4 días × 24 h = ${cnc01Metric.plannedOperatingMinutes} min (96 h)`
  );
  // Paro en CNC-01 = 100 min
  // Operativo = 5760 - 100 = 5660 min
  // Disponibilidad = (5660 / 5760) * 100 = 98.26% -> 98.3%
  assert(
    cnc01Metric.availabilityPercent !== null &&
      cnc01Metric.availabilityPercent >= 98 &&
      cnc01Metric.availabilityPercent <= 99,
    `Disponibilidad de CNC-01 = (5,660 / 5,760) × 100 = ${cnc01Metric.availabilityFormatted}`
  );

  // CNC-02 con solo 15 min de paro:
  assert(
    cnc02Metric.availabilityPercent !== null && cnc02Metric.availabilityPercent > 99,
    `Disponibilidad de CNC-02 con mínimo paro planeado = ${cnc02Metric.availabilityFormatted}`
  );

  // ----------------------------------------------------
  // 5. Manejo de Casos Especiales y Ausencia de NaN / Infinity
  // ----------------------------------------------------
  console.log("\n5. Robustez Matemática y Manejo de Casos Especiales:");

  // Máquina vacía sin paros
  const emptyMachineMetrics = calculateReliabilityMetrics([], sampleMachines, {
    dateFrom: "2026-09-20",
    dateTo: "2026-09-21",
  });

  assert(
    emptyMachineMetrics.mttrMinutes === null &&
      emptyMachineMetrics.mttrFormatted === "Sin fallas registradas",
    "Cero paros en planta: MTTR se formatea como 'Sin fallas registradas' (no NaN)"
  );
  assert(
    emptyMachineMetrics.mtbfHours === null &&
      emptyMachineMetrics.mtbfFormatted === "Sin fallas registradas",
    "Cero paros en planta: MTBF se formatea como 'Sin fallas registradas' (no NaN)"
  );
  assert(
    emptyMachineMetrics.availabilityPercent === 100,
    "Cero paros en planta: Disponibilidad al 100.0% con cero inactividad"
  );
  assert(
    !isNaN(Number(emptyMachineMetrics.availabilityPercent)) &&
      isFinite(Number(emptyMachineMetrics.availabilityPercent)),
    "Ningún cálculo produce NaN ni Infinity bajo condiciones de frontera"
  );

  // ----------------------------------------------------
  // 6. Pruebas de Integración con el Servicio Central del Dashboard
  // ----------------------------------------------------
  console.log("\n6. Pruebas de Integración con getDashboardData y Datos del Sistema:");

  const liveDashboardData = await getDashboardData({}, adminUser);
  const rel = liveDashboardData.reliability;

  assert(
    Boolean(rel) && typeof rel === "object",
    "getDashboardData retorna objeto 'reliability' de la FASE 9"
  );
  assert(
    typeof rel.reparableFailuresCount === "number" && rel.reparableFailuresCount >= 2,
    `Fallas reparables detectadas en el sistema: ${rel.reparableFailuresCount} fallas`
  );
  assert(
    typeof rel.mttrFormatted === "string" && rel.mttrFormatted.length > 0,
    `MTTR del sistema calculado: ${rel.mttrFormatted}`
  );
  assert(
    typeof rel.mtbfFormatted === "string" && rel.mtbfFormatted.length > 0,
    `MTBF del sistema calculado: ${rel.mtbfFormatted}`
  );
  assert(
    typeof rel.availabilityFormatted === "string" && rel.availabilityFormatted.includes("%"),
    `Disponibilidad del sistema calculada: ${rel.availabilityFormatted}`
  );

  // Comparativa por Máquinas
  assert(
    Array.isArray(rel.byMachine) && rel.byMachine.length >= 5,
    `Desglose comparativo por máquina incluye ${rel.byMachine.length} máquinas del catálogo industrial`
  );

  const cnc01Live = rel.byMachine.find((m) => m.machineCode === "CNC-01");
  assert(
    Boolean(cnc01Live) && cnc01Live!.reparableFailuresCount >= 2,
    `CNC-01 contiene al menos 2 fallas reparables para cálculo de MTBF en vivo`
  );
  assert(
    cnc01Live!.intervalsCount >= 1 && cnc01Live!.mtbfHours !== null,
    `CNC-01 cuenta con intervalo entre fallas válido (MTBF = ${cnc01Live!.mtbfFormatted})`
  );

  // Filtro por Máquina específica
  const filteredCnc01 = await getDashboardData({ machineId: cnc01Live!.machineId }, adminUser);
  assert(
    filteredCnc01.reliability.selectedMachineCode === "CNC-01" &&
      filteredCnc01.reliability.byMachine.length === 1,
    "Filtro por máquina específica enfoca los indicadores de confiabilidad a CNC-01"
  );

  // ----------------------------------------------------
  // 7. Verificación de Límites de Alcance
  // ----------------------------------------------------
  console.log("\n7. Verificación de Límites de Alcance de la FASE 9:");
  assert(
    !("paretoChart" in liveDashboardData) && !("paretoCurve" in rel),
    "Límite respetado: No se implementa diagrama de Pareto (reservado para FASE 10)"
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runReliabilityTests().catch((e) => {
  console.error("Fallo inesperado en pruebas de confiabilidad:", e);
  process.exit(1);
});
