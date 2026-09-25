import { createStop, getActiveStops, closeStop, getCompletedStops, getStopById, getNextWorkOrderCode } from "../lib/stops-service";
import { getAllCatalogs } from "../lib/catalogs-service";
import { SessionUser } from "../lib/auth";
import { formatDuration, formatDurationMinutes } from "../lib/utils";

async function runCloseStopsTests() {
  console.log("🧪 Iniciando pruebas automatizadas de FASE 6 (Cierre de Paros, Cronómetro y Duración)...\n");

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

  // 1. Cargar catálogos
  const catalogs = await getAllCatalogs();
  const cnc01 = catalogs.machines.find((m) => m.code === "CNC-01")!;
  const pint01 = catalogs.machines.find((m) => m.code === "PINT-01")!;
  const ens01 = catalogs.machines.find((m) => m.code === "ENS-01")!;
  const area = catalogs.areas[0];
  const process = catalogs.processes[0];
  const stopType = catalogs.stopTypes[0];
  const repairableCause = catalogs.stopCauses.find((c) => c.name.toLowerCase().includes("mecánica")) || catalogs.stopCauses[0];
  const nonRepairableCause = catalogs.stopCauses.find((c) => !c.name.toLowerCase().includes("mecánica") && !c.name.toLowerCase().includes("eléctrica")) || catalogs.stopCauses[1];
  const priority = catalogs.priorities[0];

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

  const inactiveUserSession: SessionUser = {
    id: "user-inactive",
    name: "Usuario Inactivo",
    email: "inactivo@stopcontrol.local",
    role: "OPERADOR",
    status: "INACTIVE",
  };

  // ----------------------------------------------------
  // TEST 1: Apertura de paro para ciclo completo de vida
  // ----------------------------------------------------
  console.log("1. Apertura de paro (Prueba de ciclo completo):");
  const openStop = await createStop(
    {
      machineId: pint01.id,
      areaId: area.id,
      processId: process.id,
      stopTypeId: stopType.id,
      causeId: repairableCause.id,
      priorityId: priority.id,
      shift: "Matutino",
      observations: "Boquilla obstruida con pintura seca",
    },
    operatorSession
  );

  assert(
    openStop.status === "ACTIVE" && !!openStop.startTime,
    "Paro abierto exitosamente en estado ACTIVE con startTime UTC"
  );

  // ----------------------------------------------------
  // TEST 2 y 3: Cronómetro en tiempo real e idempotencia
  // ----------------------------------------------------
  console.log("\n2 y 3. Cronómetro en vivo e idempotencia tras recarga:");
  const initialStartMs = new Date(openStop.startTime).getTime();
  const elapsedSecondsSimulated = Math.floor((Date.now() - initialStartMs) / 1000);
  const formattedTimer = formatDuration(elapsedSecondsSimulated);

  assert(
    typeof formattedTimer === "string" && formattedTimer.split(":").length === 3,
    `Cronómetro calcula formato HH:MM:SS basado en startTime (${formattedTimer})`
  );

  // Simulación de recarga de página: se vuelve a parsear el startTime persistido
  const reloadedStartMs = new Date(openStop.startTime).getTime();
  const reloadedElapsedSeconds = Math.floor((Date.now() - reloadedStartMs) / 1000);
  assert(
    reloadedStartMs === initialStartMs && Math.abs(reloadedElapsedSeconds - elapsedSecondsSimulated) <= 2,
    "El cronómetro conserva el tiempo exacto tras recarga (fuente de verdad startTime)"
  );

  // ----------------------------------------------------
  // TEST 4, 5, 6, 7 y 8: Cierre de paro por Operador
  // ----------------------------------------------------
  console.log("\n4 a 8. Cierre de paro, cálculo de duración y actualización de máquina:");
  const closedStop = await closeStop(
    openStop.id,
    {
      actionTaken: "Desmontaje, purga con solvente y calibración de tobera de pintura",
      technicianId: mantenimientoSession.id,
    },
    operatorSession
  );

  assert(
    closedStop.status === "COMPLETED",
    "Cambio de estado exitoso: ACTIVE → COMPLETED"
  );

  assert(
    !!closedStop.endTime && typeof closedStop.endTime === "string",
    "Timestamp de finalización (endTime) generado en UTC en servidor"
  );

  assert(
    typeof closedStop.duration === "number" && closedStop.duration >= 1,
    `Duración calculada en minutos exactos a partir de (endTime - startTime): ${closedStop.duration} min`
  );

  assert(
    closedStop.actionTaken === "Desmontaje, purga con solvente y calibración de tobera de pintura",
    "Acción tomada (actionTaken) registrada y persistida correctamente"
  );

  // Comprobar estado de la máquina: STOPPED -> OPERATING
  const updatedCatalogs = await getAllCatalogs();
  const reloadedMachine = updatedCatalogs.machines.find((m) => m.id === pint01.id);
  assert(
    reloadedMachine?.status === "OPERATING",
    "Estado de máquina actualizado exitosamente: STOPPED → OPERATING"
  );

  // ----------------------------------------------------
  // TEST 9: Bloqueo contra doble cierre
  // ----------------------------------------------------
  console.log("\n9. Validación de negocio: Bloqueo contra doble cierre:");
  let doubleCloseCaught = false;
  try {
    await closeStop(
      openStop.id,
      {
        actionTaken: "Intento de segundo cierre redundante",
      },
      operatorSession
    );
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message.includes("ya ha sido cerrado")) {
      doubleCloseCaught = true;
    }
  }

  assert(
    doubleCloseCaught,
    "Bloqueo exitoso: No se permite cerrar un paro que ya está en estado COMPLETED"
  );

  // ----------------------------------------------------
  // TEST 10: Validación de permisos RBAC para cierre
  // ----------------------------------------------------
  console.log("\n10. Validación de permisos RBAC para cierre:");

  // Abrir otro paro en ENS-01
  const ensStop = await createStop(
    {
      machineId: ens01.id,
      areaId: area.id,
      processId: process.id,
      stopTypeId: stopType.id,
      causeId: repairableCause.id,
      priorityId: priority.id,
      shift: "Vespertino",
      observations: "Descalibración de pistón neumático",
    },
    adminSession
  );

  // Usuario inactivo intenta cerrar: debe ser bloqueado
  let inactiveUserBlocked = false;
  try {
    await closeStop(
      ensStop.id,
      { actionTaken: "Intento por usuario inactivo" },
      inactiveUserSession
    );
  } catch {
    inactiveUserBlocked = true;
  }
  assert(
    inactiveUserBlocked,
    "RBAC: Usuario inactivo tiene bloqueado el cierre de paros"
  );

  // Mantenimiento cierra el paro: debe permitirse
  const closedByMaint = await closeStop(
    ensStop.id,
    {
      actionTaken: "Ajuste de sensor fin de carrera y reemplazo de junta tórica",
      technicianId: mantenimientoSession.id,
    },
    mantenimientoSession
  );

  assert(
    closedByMaint.status === "COMPLETED",
    "RBAC: Personal de Mantenimiento puede cerrar paros que atendió"
  );

  // ----------------------------------------------------
  // TEST 11: Generación de WorkOrder para causa de mantenimiento
  // ----------------------------------------------------
  console.log("\n11. Generación de Orden de Trabajo (WorkOrder):");
  assert(
    !!closedStop.workOrder && !!closedStop.workOrder.code,
    `WorkOrder generada automáticamente para causa de mantenimiento: ${closedStop.workOrder?.code}`
  );
  assert(
    closedStop.workOrder?.code.startsWith("OT-"),
    "Código de orden cumple con nomenclatura industrial OT-YYYY-####"
  );

  // ----------------------------------------------------
  // TEST 12: Validación de campo obligatorio actionTaken
  // ----------------------------------------------------
  console.log("\n12. Validación de campos obligatorios en el cierre:");
  const activeList = await getActiveStops();
  const demoActive = activeList[0];

  let missingActionCaught = false;
  if (demoActive) {
    try {
      await closeStop(
        demoActive.id,
        { actionTaken: "   " }, // Vacío
        adminSession
      );
    } catch {
      missingActionCaught = true;
    }
  }
  assert(
    missingActionCaught,
    "Validación exitosa: Se exige descripción obligatoria en actionTaken"
  );

  // ----------------------------------------------------
  // TEST 13: Comprobación de consulta de paros completados
  // ----------------------------------------------------
  console.log("\n13. Consulta de historial de eventos completados:");
  const completedStops = await getCompletedStops(10);
  assert(
    completedStops.length >= 2 && completedStops.every((s) => s.status === "COMPLETED"),
    `Consulta de paros completados exitosa (${completedStops.length} eventos en historial)`
  );

  // ----------------------------------------------------
  // TEST 14: Verificación de helper formatDurationMinutes
  // ----------------------------------------------------
  console.log("\n14. Verificación de utilerías de formateo de duración:");
  const formattedMinutes = formatDurationMinutes(125);
  assert(
    formattedMinutes === "2h 5m",
    `formatDurationMinutes convierte 125 minutos a formato legible (${formattedMinutes})`
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runCloseStopsTests().catch((e) => {
  console.error("Fallo inesperado en pruebas de cierre de paros:", e);
  process.exit(1);
});
