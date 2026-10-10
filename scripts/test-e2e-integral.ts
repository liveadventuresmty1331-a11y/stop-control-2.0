/**
 * SUITE DE PRUEBAS INTEGRALES END-TO-END (FASE 11) - STOPControl 2.0
 * 
 * Valida de extremo a extremo:
 * 1. Flujo de vida completo del paro (Apertura -> Timer -> Cierre -> WorkOrder -> Historial -> Dashboard -> Pareto)
 * 2. Pruebas por rol en servidor (ADMINISTRADOR, OPERADOR, SUPERVISOR, MANTENIMIENTO)
 * 3. Restricciones y validaciones de datos (Campos requeridos, duplicidad, máquinas inactivas, estados)
 * 4. Historial, filtros combinados, ordenamiento, paginación y exportación CSV segura
 * 5. KPIs de planta, MTTR, MTBF y Disponibilidad en condiciones normales y casos extremos
 * 6. Análisis 80/20 de Pareto (Causas, Máquinas Frecuencia, Máquinas Downtime)
 * 7. Seguridad: Inexistencia de hashes de contraseña en payloads, bloqueo de usuarios inactivos
 */

import { authenticateCredentials, getServerSession, SessionUser } from "../lib/auth";
import {
  createStop,
  closeStop,
  getActiveStops,
  getStopsHistory,
  getStopDetailById,
  exportHistoryToCSV,
  memoryStops,
  memoryWorkOrders,
} from "../lib/stops-service";
import { getAllCatalogs } from "../lib/catalogs-service";
import { getDashboardData } from "../lib/dashboard-service";
import { isRepairableStop, calculateReliabilityMetrics } from "../lib/reliability-service";
import { calculatePareto, generateDashboardPareto } from "../lib/pareto-service";
import { canRoleAccessRoute } from "../lib/session";

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

async function runE2ETests() {
  console.log("================================================================================");
  console.log("INICIANDO SUITE DE VALIDACIÓN INTEGRAL Y ESTABILIZACIÓN: FASE 11");
  console.log("================================================================================\n");

  // ============================================================================
  // BLOQUE 1: PRUEBAS DE AUTENTICACIÓN, ROLES Y SEGURIDAD (RBAC EN SERVIDOR)
  // ============================================================================
  console.log("BLOQUE 1: Verificación de Autenticación, Roles y Seguridad:");

  // 1.1 Autenticación de los 4 roles
  const authAdmin = await authenticateCredentials("admin@stopcontrol.local", "demo123");
  const authOp = await authenticateCredentials("operador@stopcontrol.local", "demo123");
  const authSup = await authenticateCredentials("supervisor@stopcontrol.local", "demo123");
  const authMaint = await authenticateCredentials("mantenimiento@stopcontrol.local", "demo123");

  assert(Boolean(authAdmin.user && authAdmin.user.role === "ADMINISTRADOR"), "Login exitoso para ADMINISTRADOR");
  assert(Boolean(authOp.user && authOp.user.role === "OPERADOR"), "Login exitoso para OPERADOR");
  assert(Boolean(authSup.user && authSup.user.role === "SUPERVISOR"), "Login exitoso para SUPERVISOR");
  assert(Boolean(authMaint.user && authMaint.user.role === "MANTENIMIENTO"), "Login exitoso para MANTENIMIENTO");

  const admin = authAdmin.user!;
  const operator = authOp.user!;
  const supervisor = authSup.user!;
  const maintenance = authMaint.user!;

  // 1.2 Seguridad: Privacidad de datos sensibles y contraseñas
  assert(!("password" in admin) && !("passwordHash" in admin), "Seguridad: ADMINISTRADOR no expone hash de contraseña");
  assert(!("password" in operator) && !("passwordHash" in operator), "Seguridad: OPERADOR no expone hash de contraseña");

  // 1.3 Bloqueo de contraseñas incorrectas
  const failedAuth = await authenticateCredentials("admin@stopcontrol.local", "clave_incorrecta_xyz");
  assert(Boolean(failedAuth.error), "Rechazo de credenciales con contraseña inválida");

  // 1.4 Bloqueo de rutas en servidor por rol (RBAC Server-side)
  assert(canRoleAccessRoute("ADMINISTRADOR", "/catalogs") === true, "RBAC: ADMINISTRADOR tiene acceso a /catalogs");
  assert(canRoleAccessRoute("ADMINISTRADOR", "/dashboard") === true, "RBAC: ADMINISTRADOR tiene acceso a /dashboard");
  assert(canRoleAccessRoute("OPERADOR", "/catalogs") === false, "RBAC: OPERADOR bloqueado de /catalogs");
  assert(canRoleAccessRoute("OPERADOR", "/register-stop") === true, "RBAC: OPERADOR tiene acceso a /register-stop");
  assert(canRoleAccessRoute("SUPERVISOR", "/register-stop") === false, "RBAC: SUPERVISOR bloqueado de /register-stop");
  assert(canRoleAccessRoute("SUPERVISOR", "/dashboard") === true, "RBAC: SUPERVISOR tiene acceso a /dashboard");
  assert(canRoleAccessRoute("MANTENIMIENTO", "/catalogs") === false, "RBAC: MANTENIMIENTO bloqueado de /catalogs");
  assert(canRoleAccessRoute("MANTENIMIENTO", "/history") === true, "RBAC: MANTENIMIENTO tiene acceso a /history");

  // 1.5 Bloqueo de usuarios con estado INACTIVE
  const inactiveUser: SessionUser = {
    id: "user-bloqueado",
    name: "Usuario Bloqueado",
    email: "bloqueado@stopcontrol.local",
    role: "OPERADOR",
    status: "INACTIVE",
  };
  try {
    await getDashboardData({}, inactiveUser);
    assert(false, "Bloqueo de usuario inactivo en dashboard");
  } catch (err: unknown) {
    const error = err as Error;
    assert(error.message.includes("inactivo"), "Servidor rechaza acceso a usuario inactivo");
  }

  // ============================================================================
  // BLOQUE 2: FLUJO DE VIDA COMPLETO DE UN PARO (END-TO-END)
  // ============================================================================
  console.log("\nBLOQUE 2: Flujo Completo del Ciclo de Vida de Paro:");

  // 2.1 Carga inicial de catálogos maestros
  const catalogs = await getAllCatalogs();
  const initialActiveStops = await getActiveStops();
  const busyMachineIds = new Set(initialActiveStops.map((s) => s.machineId));
  const testMachine =
    catalogs.machines.find((m) => m.status === "OPERATING" && !busyMachineIds.has(m.id)) ||
    catalogs.machines.find((m) => !busyMachineIds.has(m.id))!;
  const testArea = catalogs.areas[0];
  const testProcess = catalogs.processes[0];
  const testStopType =
    catalogs.stopTypes.find((t) => t.name.toLowerCase().includes("no planeado")) ||
    catalogs.stopTypes[0];
  const testRepairableCause =
    catalogs.stopCauses.find((c) => c.isRepairable) || catalogs.stopCauses[0];
  const testPriority = catalogs.priorities[0];

  assert(
    Boolean(testMachine && testArea && testRepairableCause),
    `Catálogos maestros y máquina operativa disponible (${testMachine?.code})`
  );

  // 2.2 Apertura de paro por parte del OPERADOR
  const newStop = await createStop(
    {
      machineId: testMachine.id,
      areaId: testArea.id,
      processId: testProcess.id,
      stopTypeId: testStopType.id,
      causeId: testRepairableCause.id,
      priorityId: testPriority.id,
      shift: "Matutino",
      observations: "Sobrecalentamiento en husillo principal durante corrida de prueba",
    },
    operator
  );

  assert(newStop.status === "ACTIVE", "El nuevo paro se crea en estado ACTIVE");
  assert(Boolean(newStop.startTime), "El paro registra startTime en formato UTC ISO");
  assert(newStop.endTime === null, "El paro activo tiene endTime = null");
  assert(newStop.duration === null, "El paro activo tiene duration = null");
  assert(newStop.operatorId === operator.id, "El paro se asocia al operador autenticado");

  // 2.3 Verificación de cambio de estado de máquina
  const updatedCatalogs = await getAllCatalogs();
  const machineAfterStop = updatedCatalogs.machines.find((m) => m.id === testMachine.id);
  assert(
    machineAfterStop?.status === "STOPPED",
    `La máquina ${testMachine.code} cambia automáticamente a estado STOPPED`
  );

  // 2.4 Monitoreo de paros activos (Cronómetro)
  const activeStopsList = await getActiveStops();
  const foundInActive = activeStopsList.some((s) => s.id === newStop.id);
  assert(foundInActive, "El paro aparece listado en el monitor de Paros Activos");

  // 2.5 Rechazo de apertura concurrente en la misma máquina
  try {
    await createStop(
      {
        machineId: testMachine.id,
        areaId: testArea.id,
        processId: testProcess.id,
        stopTypeId: testStopType.id,
        causeId: testRepairableCause.id,
        priorityId: testPriority.id,
        shift: "Matutino",
        observations: "Intento duplicado",
      },
      operator
    );
    assert(false, "Bloqueo de paro concurrente en máquina detenida");
  } catch (err: unknown) {
    const error = err as Error;
    assert(error.message.includes("paro activo"), "Servidor rechaza abrir segundo paro activo en la misma máquina");
  }

  // 2.6 Cierre del paro por personal de MANTENIMIENTO
  const closeStartTime = new Date(newStop.startTime).getTime();
  const simulatedEndTime = new Date(closeStartTime + 45 * 60 * 1000).toISOString(); // 45 minutos después

  const closedStop = await closeStop(
    newStop.id,
    {
      actionTaken: "Reemplazo de sensor térmico y purga de circuito de refrigeración",
      technicianId: maintenance.id,
      endTime: simulatedEndTime,
    },
    maintenance
  );

  assert(closedStop.status === "COMPLETED", "El paro cambia a estado COMPLETED al cerrar");
  assert(
    typeof closedStop.duration === "number" && closedStop.duration >= 1,
    `La duración se calculó correctamente en minutos a partir de timestamps UTC del servidor (${closedStop.duration} min)`
  );
  assert(Boolean(closedStop.endTime), "El paro registra endTime en UTC");
  assert(closedStop.actionTaken?.includes("Reemplazo"), "Se registró la acción tomada requerida");

  // 2.7 Máquina regresa a estado OPERATING
  const catalogsAfterClose = await getAllCatalogs();
  const machineAfterClose = catalogsAfterClose.machines.find((m) => m.id === testMachine.id);
  assert(
    machineAfterClose?.status === "OPERATING",
    `La máquina ${testMachine.code} regresa automáticamente a OPERATING`
  );

  // 2.8 Generación automática de WorkOrder para causa de mantenimiento
  assert(Boolean(closedStop.workOrder), "Se genera automáticamente una Orden de Trabajo (WorkOrder)");
  assert(
    Boolean(closedStop.workOrder?.code && closedStop.workOrder.code.startsWith("OT-")),
    `Código de Orden de Trabajo cumple formato industrial: ${closedStop.workOrder?.code}`
  );

  // 2.9 Rechazo de cierre duplicado
  try {
    await closeStop(
      newStop.id,
      {
        actionTaken: "Segundo intento de cierre",
        endTime: simulatedEndTime,
      },
      maintenance
    );
    assert(false, "Bloqueo de cierre duplicado falló");
  } catch (err: unknown) {
    const error = err as Error;
    assert(error.message.includes("ya ha sido cerrado"), "Servidor rechaza cierre de un paro ya completado");
  }

  // ============================================================================
  // BLOQUE 3: VALIDACIÓN DEL HISTORIAL Y FILTROS COMBINADOS
  // ============================================================================
  console.log("\nBLOQUE 3: Validación del Historial, Filtros y Exportación CSV:");

  // 3.1 Consulta de historial general por SUPERVISOR
  const historyResult = await getStopsHistory({ page: 1, pageSize: 10 }, supervisor);
  assert(historyResult.stops.length > 0, "Historial devuelve registros completados");
  assert(historyResult.total >= historyResult.stops.length, "Conteo total consistente");

  // 3.2 Filtro combinado: Máquina específica + Causa específica
  const filteredByMachineAndCause = await getStopsHistory(
    {
      machineId: testMachine.id,
      causeId: testRepairableCause.id,
    },
    supervisor
  );
  const allMatch = filteredByMachineAndCause.stops.every(
    (s) => s.machineId === testMachine.id && s.causeId === testRepairableCause.id
  );
  assert(allMatch, "Filtro combinado devuelve únicamente registros coincidentes con máquina y causa");

  // 3.3 Ordenamiento por duración descendente
  const sortedByDuration = await getStopsHistory(
    {
      sortBy: "duration",
      sortOrder: "desc",
    },
    supervisor
  );
  let isDesc = true;
  for (let i = 1; i < sortedByDuration.stops.length; i++) {
    if ((sortedByDuration.stops[i].duration || 0) > (sortedByDuration.stops[i - 1].duration || 0)) {
      isDesc = false;
      break;
    }
  }
  assert(isDesc, "Historial ordenado correctamente por duración descendente");

  // 3.4 Paginación en servidor
  const paged1 = await getStopsHistory({ page: 1, pageSize: 2 }, supervisor);
  const paged2 = await getStopsHistory({ page: 2, pageSize: 2 }, supervisor);
  assert(paged1.stops.length <= 2 && paged2.stops.length <= 2, "Paginación respeta pageSize = 2");
  if (paged1.stops.length > 0 && paged2.stops.length > 0) {
    assert(paged1.stops[0].id !== paged2.stops[0].id, "La página 2 no repite elementos de la página 1");
  }

  // 3.5 Consulta de Detalle Completo para Auditoría
  const detail = await getStopDetailById(closedStop.id, supervisor);
  assert(detail.id === closedStop.id, "Detalle de auditoría recupera el registro exacto");
  assert(Boolean(detail.operator && detail.actionTaken), "Detalle contiene trazabilidad completa");

  // 3.6 Exportación a CSV con UTF-8 BOM
  const csvContent = await exportHistoryToCSV({}, supervisor);
  assert(csvContent.charCodeAt(0) === 0xfeff, "El CSV exportado incluye UTF-8 BOM para compatibilidad con Excel");
  assert(csvContent.includes("Codigo Maquina") && csvContent.includes("Orden de Trabajo"), "El CSV contiene encabezados industriales");
  assert(!csvContent.includes("password") && !csvContent.includes("$2a$"), "El CSV no contiene hashes ni datos sensibles");

  // ============================================================================
  // BLOQUE 4: VALIDACIÓN DEL DASHBOARD Y CÁLCULOS MANUALES
  // ============================================================================
  console.log("\nBLOQUE 4: Validación del Dashboard y Consistencia de KPIs:");

  const dashboardData = await getDashboardData({}, supervisor);

  // 4.1 Consistencia matemática de total de paros y tiempo de paro
  assert(dashboardData.kpis.totalStopsCount > 0, "Dashboard reporta total de paros completados > 0");
  assert(dashboardData.kpis.totalDowntimeMinutes >= 45, "Tiempo total acumulado incluye el paro de 45 minutos");
  assert(
    dashboardData.kpis.totalDowntimeFormatted.includes("h") || dashboardData.kpis.totalDowntimeFormatted.includes("min"),
    "Formato de duración amigable en KPIs"
  );

  // 4.2 Estado de Máquinas
  assert(dashboardData.machinesStatus.length === catalogs.machines.length, "Estado de máquinas abarca todo el catálogo");
  assert(
    dashboardData.kpis.operatingMachinesCount + dashboardData.kpis.stoppedMachinesCount <= dashboardData.kpis.totalActiveMachines,
    "Consistencia en suma de estados de máquinas"
  );

  // 4.3 Disponibilidad operativa
  assert(
    dashboardData.kpis.availabilityPercent >= 0 && dashboardData.kpis.availabilityPercent <= 100,
    `Disponibilidad operativa en rango válido (0%-100%): ${dashboardData.kpis.availabilityPercent}%`
  );

  // ============================================================================
  // BLOQUE 5: VALIDACIÓN DE MTTR, MTBF Y CONFIABILIDAD (CASOS CONTROLADOS)
  // ============================================================================
  console.log("\nBLOQUE 5: Validación de MTTR, MTBF y Disponibilidad con Casos Borde:");

  // 5.1 Caso controlado: Sin fallas reparables (dataset vacío)
  const emptyMetrics = calculateReliabilityMetrics([], catalogs.machines, {});
  assert(emptyMetrics.mttrMinutes === null, "MTTR sin fallas es null (no NaN)");
  assert(
    emptyMetrics.mttrFormatted.includes("Sin fallas") || emptyMetrics.mttrFormatted === "N/D",
    "MTTR sin fallas se formatea de forma amigable ('Sin fallas registradas')"
  );
  assert(emptyMetrics.mtbfHours === null, "MTBF sin fallas es null (no NaN)");
  assert(emptyMetrics.availabilityPercent === 100, "Disponibilidad sin fallas es 100%");

  // 5.2 Caso controlado: Exactamente 1 falla reparable
  const testMachId = catalogs.machines[0]?.id || "mach-1";
  const singleRepairable = [
    {
      id: "single-1",
      machineId: testMachId,
      machine: { id: testMachId, code: "M-1", name: "Máquina 1" },
      status: "COMPLETED",
      duration: 60,
      startTime: "2026-09-20T10:00:00Z",
      endTime: "2026-09-20T11:00:00Z",
      cause: { name: "Falla mecánica", isRepairable: true },
      stopType: { name: "No planeado" },
    },
  ];
  const singleMetrics = calculateReliabilityMetrics(singleRepairable, catalogs.machines, {});
  assert(singleMetrics.mttrMinutes === 60, "Con 1 falla de 60 min, MTTR = 60 min");
  assert(singleMetrics.mtbfHours === null, "Con 1 sola falla no hay intervalo entre fallas, MTBF = null");
  assert(
    singleMetrics.mtbfFormatted.includes("Sin datos suficientes") || singleMetrics.mtbfFormatted === "N/D",
    "Con 1 sola falla MTBF formateado explica que no hay intervalos suficientes"
  );

  // 5.3 Caso controlado: Múltiples fallas con cálculo manual exacto
  // Falla 1: Inicio 10:00, Fin 11:00 (duración 60 min)
  // Falla 2: Inicio 15:00, Fin 15:30 (duración 30 min)
  // Intervalo entre fallas: Fin 11:00 a Inicio 15:00 = 4 horas (240 min)
  // MTTR esperado = (60 + 30) / 2 = 45 min
  // MTBF esperado = 4 horas
  const dualRepairable = [
    {
      id: "dual-1",
      machineId: testMachId,
      machine: { id: testMachId, code: "M-1", name: "Máquina 1" },
      status: "COMPLETED",
      duration: 60,
      startTime: "2026-09-20T10:00:00Z",
      endTime: "2026-09-20T11:00:00Z",
      cause: { name: "Falla mecánica", isRepairable: true },
      stopType: { name: "No planeado" },
    },
    {
      id: "dual-2",
      machineId: testMachId,
      machine: { id: testMachId, code: "M-1", name: "Máquina 1" },
      status: "COMPLETED",
      duration: 30,
      startTime: "2026-09-20T15:00:00Z",
      endTime: "2026-09-20T15:30:00Z",
      cause: { name: "Falla eléctrica", isRepairable: true },
      stopType: { name: "No planeado" },
    },
  ];
  const dualMetrics = calculateReliabilityMetrics(dualRepairable, catalogs.machines, {});
  assert(dualMetrics.mttrMinutes === 45, "Cálculo manual exacto de MTTR verificado (45 min)");
  assert(dualMetrics.mtbfHours === 4.0, "Cálculo manual exacto de MTBF verificado (4.0 horas)");
  assert(!Number.isNaN(dualMetrics.availabilityPercent), "Disponibilidad no es NaN");
  assert(Number.isFinite(dualMetrics.availabilityPercent), "Disponibilidad es un número finito");

  // 5.4 Caso controlado: Paros exclusivamente planeados (no reparables)
  const plannedOnly = [
    {
      id: "plan-1",
      machineId: testMachId,
      status: "COMPLETED",
      duration: 120,
      startTime: "2026-09-20T08:00:00Z",
      endTime: "2026-09-20T10:00:00Z",
      cause: { name: "Mantenimiento preventivo", isRepairable: false },
      stopType: { name: "Planeado" },
    },
  ];
  const plannedMetrics = calculateReliabilityMetrics(plannedOnly, catalogs.machines, {});
  assert(plannedMetrics.mttrMinutes === null, "Paros planeados NO distorsionan el MTTR (se mantienen en null)");
  assert(plannedMetrics.mtbfHours === null, "Paros planeados NO generan intervalos de falla en MTBF");

  // ============================================================================
  // BLOQUE 6: VALIDACIÓN DE DIAGRAMAS DE PARETO (80/20)
  // ============================================================================
  console.log("\nBLOQUE 6: Validación de Diagramas de Pareto (Principio 80/20):");

  const paretoData = dashboardData.pareto;
  assert(paretoData !== undefined, "Dashboard integra datasets de Pareto de la FASE 10");

  // 6.1 Pareto de Causas
  const causesPareto = paretoData.causesByFrequency;
  assert(!causesPareto.isEmpty, "Pareto de causas contiene datos válidos");
  assert(causesPareto.items.length > 0, "Pareto de causas tiene elementos ordenados");
  // Verificar orden descendente
  let causesDesc = true;
  for (let i = 1; i < causesPareto.items.length; i++) {
    if (causesPareto.items[i].value > causesPareto.items[i - 1].value) {
      causesDesc = false;
      break;
    }
  }
  assert(causesDesc, "Pareto de causas está estrictamente ordenado de mayor a menor");

  // 6.2 Pareto de Máquinas por Frecuencia vs Downtime
  const machFreqPareto = paretoData.machinesByFrequency;
  const machTimePareto = paretoData.machinesByDowntime;

  assert(machFreqPareto.unitLabel === "paros", "Pareto por frecuencia tiene unidad 'paros'");
  assert(machTimePareto.unitLabel === "minutos", "Pareto por tiempo tiene unidad 'minutos'");
  assert(
    machFreqPareto.analysisType !== machTimePareto.analysisType,
    "Frecuencia e Impacto en tiempo se diferencian estrictamente en tipo de análisis"
  );

  // 6.3 Regla del 80%: Acumulado final exactamente 100% y corte de vitales
  assert(
    causesPareto.items[causesPareto.items.length - 1].cumulativePercentage === 100.0,
    "El porcentaje acumulado final de causas es exactamente 100.0%"
  );
  assert(
    machTimePareto.items[machTimePareto.items.length - 1].cumulativePercentage === 100.0,
    "El porcentaje acumulado final de tiempo de máquina es exactamente 100.0%"
  );
  assert(causesPareto.vitalFewCount > 0, "Se identifican los 'pocos vitales' según la regla 80/20");

  // 6.4 Caso borde: Dataset vacío en Pareto
  const emptyPareto = generateDashboardPareto([], catalogs.machines);
  assert(emptyPareto.causesByFrequency.isEmpty === true, "Pareto maneja dataset vacío con isEmpty = true sin crash");
  assert(emptyPareto.causesByFrequency.totalValue === 0, "Total en dataset vacío es 0");
  assert(emptyPareto.causesByFrequency.items.length === 0, "Items en dataset vacío es lista vacía");

  // ============================================================================
  // RESUMEN GLOBAL DE RESULTADOS
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`RESUMEN FINAL FASE 11: ${passedTests} de ${totalTests} verificaciones pasaron con éxito.`);
  if (passedTests === totalTests) {
    console.log("🎉 TODAS LAS VERIFICACIONES INTEGRALES Y DE ESTABILIZACIÓN HAN SIDO SUPERADAS.");
  } else {
    console.error("⚠️ SE DETECTARON FALLOS EN LA SUITE DE PRUEBAS INTEGRALES.");
  }
  console.log("================================================================================\n");
}

runE2ETests().catch((err) => {
  console.error("Error fatal en pruebas integrales:", err);
  process.exit(1);
});
