import { createStop, getActiveStops } from "../lib/stops-service";
import { getAllCatalogs, createCatalogItem, toggleItemStatus } from "../lib/catalogs-service";
import { SessionUser } from "../lib/auth";

async function runStopsTests() {
  console.log("🧪 Iniciando pruebas automatizadas de FASE 5 (Registro y Apertura de Paros)...\n");

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

  // Cargar catálogos disponibles
  const catalogs = await getAllCatalogs();
  const cnc02 = catalogs.machines.find((m) => m.code === "CNC-02")!;
  const area = catalogs.areas[0];
  const process = catalogs.processes[0];
  const stopType = catalogs.stopTypes[0];
  const cause = catalogs.stopCauses[0];
  const priority = catalogs.priorities[0];

  const operatorSession: SessionUser = {
    id: "user-2",
    name: "Juan Pérez",
    email: "operador@stopcontrol.local",
    role: "OPERADOR",
    status: "ACTIVE",
  };

  const adminSession: SessionUser = {
    id: "user-1",
    name: "Carlos Mendoza",
    email: "admin@stopcontrol.local",
    role: "ADMINISTRADOR",
    status: "ACTIVE",
  };

  const supervisorSession: SessionUser = {
    id: "user-3",
    name: "Roberto Gómez",
    email: "supervisor@stopcontrol.local",
    role: "SUPERVISOR",
    status: "ACTIVE",
  };

  const mantenimientoSession: SessionUser = {
    id: "user-4",
    name: "Laura Ramos",
    email: "mantenimiento@stopcontrol.local",
    role: "MANTENIMIENTO",
    status: "ACTIVE",
  };

  // 1. Operador inicia un paro correctamente
  console.log("1. Registro de Paro por Operador:");
  const createdStopOp = await createStop(
    {
      machineId: cnc02.id,
      areaId: area.id,
      processId: process.id,
      stopTypeId: stopType.id,
      causeId: cause.id,
      priorityId: priority.id,
      shift: "Matutino",
      observations: "Vibración excesiva al iniciar ciclo de desbaste",
    },
    operatorSession
  );

  assert(
    createdStopOp.status === "ACTIVE",
    "Estado del paro registrado es ACTIVE"
  );
  assert(
    !!createdStopOp.startTime && typeof createdStopOp.startTime === "string",
    "Fecha y hora de inicio (startTime) registrada en formato UTC"
  );
  assert(
    createdStopOp.endTime === null && createdStopOp.duration === null,
    "endTime y duration son nulos en la apertura (corresponden a Fase 6)"
  );
  assert(
    createdStopOp.shift === "Matutino",
    "Turno de trabajo (Matutino) conservado correctamente"
  );

  // 2. Administrador inicia un paro correctamente en otra máquina
  console.log("\n2. Registro de Paro por Administrador:");
  const sold01 = catalogs.machines.find((m) => m.code === "SOLD-01")!;
  const createdStopAdmin = await createStop(
    {
      machineId: sold01.id,
      areaId: area.id,
      processId: process.id,
      stopTypeId: stopType.id,
      causeId: cause.id,
      priorityId: priority.id,
      shift: "Vespertino",
      observations: "Sobrecalentamiento en devanado de transformador",
    },
    adminSession
  );

  assert(
    createdStopAdmin.status === "ACTIVE" && createdStopAdmin.machineId === sold01.id,
    "Administrador puede registrar y abrir paros correctamente"
  );

  // 3. Validación contra segundo paro activo simultáneo para la misma máquina
  console.log("\n3. Regla de Negocio: No permitir 2 paros simultáneos en la misma máquina:");
  let secondStopFailed = false;
  try {
    await createStop(
      {
        machineId: cnc02.id, // Ya tiene el paro abierto arriba
        areaId: area.id,
        processId: process.id,
        stopTypeId: stopType.id,
        causeId: cause.id,
        priorityId: priority.id,
        shift: "Nocturno",
      },
      operatorSession
    );
  } catch (err: any) {
    secondStopFailed = true;
  }
  assert(
    secondStopFailed,
    "Bloqueo exitoso: No se permite abrir un segundo paro activo para la misma máquina"
  );

  // 4. Validación de campos obligatorios faltantes
  console.log("\n4. Validación de campos obligatorios requeridos:");
  let missingFieldCaught = false;
  try {
    await createStop(
      {
        machineId: "", // Falta máquina
        areaId: area.id,
        processId: process.id,
        stopTypeId: stopType.id,
        causeId: cause.id,
        priorityId: priority.id,
        shift: "Matutino",
      },
      operatorSession
    );
  } catch (err: any) {
    missingFieldCaught = true;
  }
  assert(
    missingFieldCaught,
    "Validación exitosa: Rechazo de paro con máquina no especificada"
  );

  // 5. Validación contra máquina inactiva
  console.log("\n5. Regla de Negocio: No permitir registrar paros para máquinas inactivas:");
  const inactiveMachine = (await createCatalogItem("machines", {
    code: "OFF-99",
    name: "Máquina Inactiva de Desecho",
    areaId: area.id,
    status: "OUT_OF_SERVICE",
  })) as { id: string; code: string };

  await toggleItemStatus("machines", inactiveMachine.id); // Desactivar máquina

  let inactiveMachineRejected = false;
  try {
    await createStop(
      {
        machineId: inactiveMachine.id,
        areaId: area.id,
        processId: process.id,
        stopTypeId: stopType.id,
        causeId: cause.id,
        priorityId: priority.id,
        shift: "Matutino",
      },
      operatorSession
    );
  } catch (err: any) {
    inactiveMachineRejected = true;
  }
  assert(
    inactiveMachineRejected,
    "Bloqueo exitoso: No se permite registrar paro para una máquina inactiva"
  );

  // 6. Restricción RBAC: Supervisor y Mantenimiento NO pueden crear paros
  console.log("\n6. Restricciones de Autorización RBAC en Servidor:");
  let supervisorBlocked = false;
  try {
    await createStop(
      {
        machineId: catalogs.machines.find((m) => m.code === "ENS-01")!.id,
        areaId: area.id,
        processId: process.id,
        stopTypeId: stopType.id,
        causeId: cause.id,
        priorityId: priority.id,
        shift: "Matutino",
      },
      supervisorSession
    );
  } catch (err: any) {
    supervisorBlocked = true;
  }
  assert(
    supervisorBlocked,
    "RBAC: Supervisor tiene denegada la apertura de paros"
  );

  let mantenimientoBlocked = false;
  try {
    await createStop(
      {
        machineId: catalogs.machines.find((m) => m.code === "ENS-01")!.id,
        areaId: area.id,
        processId: process.id,
        stopTypeId: stopType.id,
        causeId: cause.id,
        priorityId: priority.id,
        shift: "Matutino",
      },
      mantenimientoSession
    );
  } catch (err: any) {
    mantenimientoBlocked = true;
  }
  assert(
    mantenimientoBlocked,
    "RBAC: Mantenimiento tiene denegada la apertura de paros"
  );

  // 7. Consulta de Paros Activos por Supervisor y Mantenimiento
  console.log("\n7. Consulta y Monitoreo de Paros Activos:");
  const activeStops = await getActiveStops();
  assert(
    activeStops.length >= 2,
    `Supervisor y Mantenimiento pueden consultar todos los paros activos (${activeStops.length} activos)`
  );

  // 8. Consulta de propios paros por Operador
  const ownStops = await getActiveStops(operatorSession.id, true);
  assert(
    ownStops.length >= 1 && ownStops.every((s) => s.operatorId === operatorSession.id),
    `Operador puede filtrar y consultar únicamente sus propios paros registrados (${ownStops.length} propios)`
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runStopsTests().catch((e) => {
  console.error("Fallo inesperado en pruebas de paros:", e);
  process.exit(1);
});
