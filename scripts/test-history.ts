import { 
  getStopsHistory, 
  getStopDetailById, 
  exportHistoryToCSV,
  createStop,
  closeStop
} from "../lib/stops-service";
import { getAllCatalogs } from "../lib/catalogs-service";
import { SessionUser } from "../lib/auth";

async function runHistoryTests() {
  console.log("🧪 Iniciando pruebas automatizadas de FASE 7 (Historial y Trazabilidad Completa)...\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Sesiones por Rol
  const adminSession: SessionUser = {
    id: "user-1",
    name: "Carlos Mendoza (Admin)",
    email: "admin@stopcontrol.local",
    role: "ADMINISTRADOR",
    status: "ACTIVE",
  };

  const operatorSession: SessionUser = {
    id: "user-2",
    name: "Juan Pérez (Operador)",
    email: "operador@stopcontrol.local",
    role: "OPERADOR",
    status: "ACTIVE",
  };

  const supervisorSession: SessionUser = {
    id: "user-3",
    name: "Roberto Gómez (Supervisor)",
    email: "supervisor@stopcontrol.local",
    role: "SUPERVISOR",
    status: "ACTIVE",
  };

  const mantenimientoSession: SessionUser = {
    id: "user-4",
    name: "Laura Ramos (Mantenimiento)",
    email: "mantenimiento@stopcontrol.local",
    role: "MANTENIMIENTO",
    status: "ACTIVE",
  };

  const catalogs = await getAllCatalogs();
  const cnc01 = catalogs.machines.find((m) => m.code === "CNC-01")!;
  const sold01 = catalogs.machines.find((m) => m.code === "SOLD-01")!;
  const areaProduccion = catalogs.areas.find((a) => a.name === "Producción")!;
  const processCorte = catalogs.processes.find((p) => p.name === "Corte")!;
  const causeMecanica = catalogs.stopCauses.find((c) => c.name.toLowerCase().includes("mecánica"))!;
  const typeNoPlaneado = catalogs.stopTypes.find((t) => t.name.toLowerCase().includes("no planeado"))!;

  // ----------------------------------------------------
  // TEST 1: Historial muestra correctamente los paros completados
  // ----------------------------------------------------
  console.log("1. Consulta inicial de paros completados en historial:");
  const initialHistory = await getStopsHistory({ status: "COMPLETED" }, adminSession);
  assert(
    initialHistory.total >= 4 && initialHistory.stops.every((s) => s.status === "COMPLETED"),
    `Historial recupera registros en estado COMPLETED (${initialHistory.total} paros encontrados)`
  );

  // ----------------------------------------------------
  // TEST 2: Filtro por máquina
  // ----------------------------------------------------
  console.log("\n2. Filtro por máquina:");
  const machineFilterResult = await getStopsHistory(
    { machineId: cnc01.id },
    adminSession
  );
  assert(
    machineFilterResult.total >= 1 && machineFilterResult.stops.every((s) => s.machineId === cnc01.id),
    `Filtro por máquina CNC-01 exitoso (${machineFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 3: Filtro por área
  // ----------------------------------------------------
  console.log("\n3. Filtro por área:");
  const areaFilterResult = await getStopsHistory(
    { areaId: areaProduccion.id },
    adminSession
  );
  assert(
    areaFilterResult.total >= 1 && areaFilterResult.stops.every((s) => s.areaId === areaProduccion.id),
    `Filtro por área Producción exitoso (${areaFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 4: Filtro por proceso
  // ----------------------------------------------------
  console.log("\n4. Filtro por proceso:");
  const processFilterResult = await getStopsHistory(
    { processId: processCorte.id },
    adminSession
  );
  assert(
    processFilterResult.total >= 1 && processFilterResult.stops.every((s) => s.processId === processCorte.id),
    `Filtro por proceso Corte exitoso (${processFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 5: Filtro por causa
  // ----------------------------------------------------
  console.log("\n5. Filtro por causa:");
  const causeFilterResult = await getStopsHistory(
    { causeId: causeMecanica.id },
    adminSession
  );
  assert(
    causeFilterResult.total >= 1 && causeFilterResult.stops.every((s) => s.causeId === causeMecanica.id),
    `Filtro por causa Falla mecánica exitoso (${causeFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 6: Filtro por tipo de paro
  // ----------------------------------------------------
  console.log("\n6. Filtro por tipo de paro:");
  const typeFilterResult = await getStopsHistory(
    { stopTypeId: typeNoPlaneado.id },
    adminSession
  );
  assert(
    typeFilterResult.total >= 1 && typeFilterResult.stops.every((s) => s.stopTypeId === typeNoPlaneado.id),
    `Filtro por tipo de paro No planeado exitoso (${typeFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 7: Filtro por turno
  // ----------------------------------------------------
  console.log("\n7. Filtro por turno:");
  const shiftFilterResult = await getStopsHistory(
    { shift: "Vespertino" },
    adminSession
  );
  assert(
    shiftFilterResult.total >= 1 && shiftFilterResult.stops.every((s) => s.shift === "Vespertino"),
    `Filtro por turno Vespertino exitoso (${shiftFilterResult.total} paros asociados)`
  );

  // ----------------------------------------------------
  // TEST 8: Filtro por rango de fechas
  // ----------------------------------------------------
  console.log("\n8. Filtro por rango de fechas:");
  const now = new Date();
  const pastThreeDays = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  const dateRangeResult = await getStopsHistory(
    { dateFrom: pastThreeDays, dateTo: tomorrow },
    adminSession
  );
  assert(
    dateRangeResult.total >= 1,
    `Filtro por rango de fechas exitoso (${dateRangeResult.total} registros en ventana temporal)`
  );

  // ----------------------------------------------------
  // TEST 9: Combinación de múltiples filtros
  // ----------------------------------------------------
  console.log("\n9. Combinación de múltiples filtros simultáneos:");
  const combinedResult = await getStopsHistory(
    {
      machineId: cnc01.id,
      areaId: areaProduccion.id,
      shift: "Matutino",
      status: "COMPLETED",
    },
    adminSession
  );
  assert(
    combinedResult.stops.every(
      (s) =>
        s.machineId === cnc01.id &&
        s.areaId === areaProduccion.id &&
        s.shift === "Matutino" &&
        s.status === "COMPLETED"
    ),
    "Combinación de filtros (Máquina + Área + Turno + Estado) resuelta con precisión"
  );

  // ----------------------------------------------------
  // TEST 10: Búsqueda textual
  // ----------------------------------------------------
  console.log("\n10. Búsqueda textual multicriterio:");
  const searchResult = await getStopsHistory(
    { search: "SOLD-01" },
    adminSession
  );
  assert(
    searchResult.total >= 1 && searchResult.stops.some((s) => s.machine?.code === "SOLD-01"),
    `Búsqueda textual por código de máquina 'SOLD-01' exitosa (${searchResult.total} encontrados)`
  );

  const searchOtResult = await getStopsHistory(
    { search: "OT-2026-0001" },
    adminSession
  );
  assert(
    searchOtResult.total >= 1 && searchOtResult.stops.some((s) => s.workOrder?.code === "OT-2026-0001"),
    `Búsqueda textual por código de orden de trabajo 'OT-2026-0001' exitosa`
  );

  // ----------------------------------------------------
  // TEST 11: Ordenamiento
  // ----------------------------------------------------
  console.log("\n11. Ordenamiento por fecha, duración y máquina:");
  const sortByDurationDesc = await getStopsHistory(
    { sortBy: "duration", sortOrder: "desc" },
    adminSession
  );
  const durations = sortByDurationDesc.stops.map((s) => s.duration || 0);
  const isSortedDesc = durations.every((val, i, arr) => !i || arr[i - 1] >= val);
  assert(
    isSortedDesc,
    `Ordenamiento por duración descendente confirmado: [${durations.slice(0, 4).join(", ")} min]`
  );

  const sortByMachineAsc = await getStopsHistory(
    { sortBy: "machine", sortOrder: "asc" },
    adminSession
  );
  const machineCodes = sortByMachineAsc.stops.map((s) => s.machine?.code || "");
  const isMachineSorted = machineCodes.every((val, i, arr) => !i || arr[i - 1].localeCompare(val) <= 0);
  assert(
    isMachineSorted,
    `Ordenamiento por máquina ascendente confirmado: [${machineCodes.slice(0, 4).join(", ")}]`
  );

  // ----------------------------------------------------
  // TEST 12: Paginación en servidor
  // ----------------------------------------------------
  console.log("\n12. Paginación en servidor (page, pageSize, totalPages):");
  const pagedResult = await getStopsHistory(
    { page: 1, pageSize: 2 },
    adminSession
  );
  assert(
    pagedResult.stops.length <= 2 && pagedResult.pageSize === 2 && pagedResult.totalPages >= 2,
    `Paginación respetada: Página 1 con ${pagedResult.stops.length} registros (Total páginas: ${pagedResult.totalPages})`
  );

  // ----------------------------------------------------
  // TEST 13: Detalle de paro y trazabilidad completa
  // ----------------------------------------------------
  console.log("\n13. Consulta de detalle de paro para auditoría:");
  const sampleStop = initialHistory.stops[0];
  const stopDetail = await getStopDetailById(sampleStop.id, adminSession);

  assert(
    stopDetail.id === sampleStop.id &&
    !!stopDetail.startTime &&
    !!stopDetail.operator?.name &&
    stopDetail.status === "COMPLETED" &&
    typeof stopDetail.duration === "number",
    `Trazabilidad completa: Operador (${stopDetail.operator?.name}), Inicio UTC, Duración (${stopDetail.duration} min), Estado (${stopDetail.status})`
  );

  // ----------------------------------------------------
  // TEST 14: Exportación CSV respetando filtros
  // ----------------------------------------------------
  console.log("\n14. Exportación de historial filtrado a CSV:");
  const csvOutput = await exportHistoryToCSV(
    { machineId: cnc01.id },
    adminSession
  );

  assert(
    typeof csvOutput === "string" && csvOutput.startsWith("\uFEFF"),
    "CSV incluye UTF-8 BOM (\\uFEFF) para compatibilidad con caracteres en español"
  );
  assert(
    csvOutput.includes("ID Paro,Fecha,Hora Inicio (UTC)") && csvOutput.includes("CNC-01"),
    "CSV contiene encabezados industriales normalizados y datos filtrados de CNC-01"
  );
  assert(
    !csvOutput.includes("password") && !csvOutput.includes("$2a$"),
    "Seguridad: Exportación CSV no incluye contraseñas, hashes ni información sensible"
  );

  // ----------------------------------------------------
  // TEST 15 y 16: Control de permisos RBAC en Servidor
  // ----------------------------------------------------
  console.log("\n15 y 16. Validación de permisos RBAC por rol en Servidor:");

  // Supervisor consulta todo el historial
  const supervisorHistory = await getStopsHistory({}, supervisorSession);
  assert(
    supervisorHistory.total >= 4,
    `Supervisor tiene acceso para consultar todo el historial (${supervisorHistory.total} paros)`
  );

  // Operador solo consulta sus propios registros
  const operatorHistory = await getStopsHistory({}, operatorSession);
  const onlyOwnRecords = operatorHistory.stops.every((s) => s.operatorId === operatorSession.id);
  assert(
    onlyOwnRecords,
    `Operador restringido a sus propios registros (${operatorHistory.total} de ${operatorSession.name})`
  );

  // Operador intenta acceder a detalle de un paro ajeno
  const otherOperatorStop = initialHistory.stops.find((s) => s.operatorId !== operatorSession.id);
  let operatorBlockedFromOther = false;
  if (otherOperatorStop) {
    try {
      await getStopDetailById(otherOperatorStop.id, operatorSession);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes("Acceso denegado")) {
        operatorBlockedFromOther = true;
      }
    }
  } else {
    operatorBlockedFromOther = true;
  }
  assert(
    operatorBlockedFromOther,
    "Bloqueo RBAC: Operador no puede acceder a registros de paros de otros operadores"
  );

  // Mantenimiento consulta paros relacionados con mantenimiento
  const maintHistory = await getStopsHistory({}, mantenimientoSession);
  assert(
    maintHistory.total >= 1 &&
      maintHistory.stops.every(
        (s) =>
          s.cause?.isRepairable !== false ||
          s.technicianId === mantenimientoSession.id ||
          Boolean(s.workOrder)
      ),
    `Mantenimiento consulta únicamente eventos con intervención o causas técnicas (${maintHistory.total} registros)`
  );

  // ----------------------------------------------------
  // TEST 17: Inmutabilidad histórica
  // ----------------------------------------------------
  console.log("\n17. Verificación de inmutabilidad histórica:");
  // Comprobar que los campos críticos del registro histórico no fueron alterados
  const verifiedStop = await getStopDetailById(sampleStop.id, adminSession);
  assert(
    verifiedStop.startTime === sampleStop.startTime &&
    verifiedStop.endTime === sampleStop.endTime &&
    verifiedStop.duration === sampleStop.duration,
    "Los registros históricos preservan inmutabilidad de timestamps, duración y trazabilidad"
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runHistoryTests().catch((e) => {
  console.error("Fallo inesperado en pruebas de historial:", e);
  process.exit(1);
});
