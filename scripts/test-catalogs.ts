import { getAllCatalogs, createCatalogItem, updateCatalogItem, toggleItemStatus } from "../lib/catalogs-service";
import { canRoleAccessRoute, ROLE_PERMISSIONS } from "../lib/auth";

async function runCatalogTests() {
  console.log("🧪 Iniciando pruebas automatizadas de FASE 4 (Catálogos Maestros & RBAC)...\n");

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

  // 1. Consulta inicial de los 7 catálogos
  console.log("1. Verificando disponibilidad de los 7 catálogos:");
  const catalogs = await getAllCatalogs();
  assert(catalogs.machines.length >= 5, `Máquinas cargadas correctamente (${catalogs.machines.length} equipos)`);
  assert(catalogs.areas.length >= 4, `Áreas cargadas correctamente (${catalogs.areas.length} áreas)`);
  assert(catalogs.processes.length >= 4, `Procesos cargados correctamente (${catalogs.processes.length} procesos)`);
  assert(catalogs.stopCauses.length >= 8, `Causas cargadas correctamente (${catalogs.stopCauses.length} causas)`);
  assert(catalogs.stopTypes.length >= 2, `Tipos de paro cargados correctamente (${catalogs.stopTypes.length} tipos)`);
  assert(catalogs.priorities.length >= 4, `Prioridades cargadas correctamente (${catalogs.priorities.length} prioridades)`);
  assert(catalogs.users.length >= 4, `Usuarios cargados correctamente (${catalogs.users.length} usuarios)`);

  // 2. Creación de nuevos registros por Administrador
  console.log("\n2. Creación de registros por Administrador:");
  const newMachine = (await createCatalogItem("machines", {
    code: "TEST-01",
    name: "Máquina de Ensayo Automatizada",
    areaId: catalogs.areas[0].id,
    status: "OPERATING",
  })) as { id: string; code: string; active: boolean };
  assert(newMachine.code === "TEST-01" && newMachine.active === true, "Creación exitosa de máquina TEST-01");

  const newArea = (await createCatalogItem("areas", {
    name: "Metrología",
    description: "Laboratorio de aseguramiento dimensional",
  })) as { name: string };
  assert(newArea.name === "Metrología", "Creación exitosa de área Metrología");

  const newCause = (await createCatalogItem("stop-causes", {
    name: "Falla de lubricación",
    description: "Presión insuficiente de aceite",
    isRepairable: true,
  })) as { name: string; isRepairable: boolean };
  assert(newCause.name === "Falla de lubricación" && newCause.isRepairable === true, "Creación de causa reparable para MTTR");

  const newUser = (await createCatalogItem("users", {
    name: "Técnico Inspector",
    email: "inspector@stopcontrol.local",
    role: "MANTENIMIENTO",
  })) as { email: string };
  assert(newUser.email === "inspector@stopcontrol.local", "Creación exitosa de nuevo usuario");

  // 3. Validación contra registros duplicados
  console.log("\n3. Validación de restricciones contra duplicados:");
  let duplicateCaught = false;
  try {
    await createCatalogItem("machines", {
      code: "TEST-01", // Mismo código
      name: "Otra máquina duplicada",
      areaId: catalogs.areas[0].id,
    });
  } catch (err: any) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, "Restricción: No se permite crear máquinas con código duplicado (TEST-01)");

  // 4. Edición de registros
  console.log("\n4. Edición y actualización de catálogos:");
  const updatedMachine = (await updateCatalogItem("machines", newMachine.id, {
    name: "Máquina de Ensayo Actualizada",
    status: "MAINTENANCE",
  })) as { name: string; status: string };
  assert(
    updatedMachine.name === "Máquina de Ensayo Actualizada" && updatedMachine.status === "MAINTENANCE",
    "Edición exitosa de atributos de máquina (nombre y estado)"
  );

  // 5. Desactivación segura (Soft-delete / Toggle status)
  console.log("\n5. Desactivación segura (Soft-delete):");
  const toggledMachine = (await toggleItemStatus("machines", newMachine.id)) as { active: boolean };
  assert(toggledMachine.active === false, "Desactivación segura de TEST-01 sin eliminar registro físico");

  const reactivatedMachine = (await toggleItemStatus("machines", newMachine.id)) as { active: boolean };
  assert(reactivatedMachine.active === true, "Reactivación de máquina TEST-01 confirmada");

  // 6. Matriz de permisos RBAC para Catálogos
  console.log("\n6. Validación de permisos RBAC para Catálogos:");
  assert(
    canRoleAccessRoute("ADMINISTRADOR", "/catalogs") === true &&
    ROLE_PERMISSIONS.ADMINISTRADOR.includes("catalogs:manage"),
    "ADMINISTRADOR tiene acceso y permisos de administración de catálogos"
  );
  assert(
    canRoleAccessRoute("SUPERVISOR", "/catalogs") === false &&
    !ROLE_PERMISSIONS.SUPERVISOR.includes("catalogs:manage"),
    "SUPERVISOR tiene denegado el acceso y gestión a /catalogs"
  );
  assert(
    canRoleAccessRoute("OPERADOR", "/catalogs") === false &&
    !ROLE_PERMISSIONS.OPERADOR.includes("catalogs:manage"),
    "OPERADOR tiene denegado el acceso y gestión a /catalogs"
  );
  assert(
    canRoleAccessRoute("MANTENIMIENTO", "/catalogs") === false &&
    !ROLE_PERMISSIONS.MANTENIMIENTO.includes("catalogs:manage"),
    "MANTENIMIENTO tiene denegado el acceso y gestión a /catalogs"
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runCatalogTests().catch((e) => {
  console.error("Fallo inesperado en pruebas de catálogos:", e);
  process.exit(1);
});
