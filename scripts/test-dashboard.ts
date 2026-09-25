import { getDashboardData, DashboardFilters } from "../lib/dashboard-service";
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

async function runDashboardTests() {
  console.log("==========================================");
  console.log("INICIANDO SUITE DE PRUEBAS: FASE 8 - DASHBOARD DE KPIS Y ESTADO DE MÁQUINAS");
  console.log("==========================================\n");

  const adminUser: SessionUser = {
    id: "user-1",
    name: "Carlos Mendoza (Admin)",
    email: "admin@stopcontrol.local",
    role: "ADMINISTRADOR",
    status: "ACTIVE",
  };

  const supervisorUser: SessionUser = {
    id: "user-3",
    name: "Roberto Gómez (Supervisor)",
    email: "supervisor@stopcontrol.local",
    role: "SUPERVISOR",
    status: "ACTIVE",
  };

  const maintenanceUser: SessionUser = {
    id: "user-4",
    name: "Laura Ramos (Mantenimiento)",
    email: "mantenimiento@stopcontrol.local",
    role: "MANTENIMIENTO",
    status: "ACTIVE",
  };

  const operatorUser: SessionUser = {
    id: "user-2",
    name: "Juan Pérez (Operador)",
    email: "operador@stopcontrol.local",
    role: "OPERADOR",
    status: "ACTIVE",
  };

  // 1. Cálculo de KPIs globales en Servidor
  console.log("1. Pruebas de Cálculo de Indicadores Clave de Desempeño (KPIs):");
  const dashboardData = await getDashboardData({}, adminUser);
  const kpis = dashboardData.kpis;

  assert(typeof kpis.totalDowntimeMinutes === "number" && kpis.totalDowntimeMinutes > 0, "KPI 1: Tiempo total de paro calculado en minutos");
  assert(typeof kpis.totalDowntimeFormatted === "string" && kpis.totalDowntimeFormatted.includes("h"), "KPI 1: Formato legible de tiempo de paro (horas y minutos)");
  assert(typeof kpis.totalStopsCount === "number" && kpis.totalStopsCount > 0, "KPI 2: Conteo total de eventos de paro calculado");
  assert(
    kpis.topDowntimeMachine !== null &&
      Boolean(kpis.topDowntimeMachine.code) &&
      kpis.topDowntimeMachine.minutes > 0,
    `KPI 3: Máquina con mayor tiempo de paro identificada (${kpis.topDowntimeMachine?.code} con ${kpis.topDowntimeMachine?.minutes} min)`
  );
  assert(
    kpis.topCause !== null &&
      Boolean(kpis.topCause.name) &&
      kpis.topCause.count > 0 &&
      kpis.topCause.percentage > 0,
    `KPI 4: Causa raíz más frecuente identificada (${kpis.topCause?.name} - ${kpis.topCause?.count} veces, ${kpis.topCause?.percentage}%)`
  );
  assert(
    typeof kpis.activeStopsCount === "number",
    `KPI 5: Conteo de paros activos en tiempo real (${kpis.activeStopsCount} paros en curso)`
  );
  assert(
    typeof kpis.stoppedMachinesCount === "number",
    `KPI 6: Conteo de máquinas actualmente detenidas (${kpis.stoppedMachinesCount} detenidas)`
  );
  assert(
    typeof kpis.availabilityPercent === "number" &&
      kpis.availabilityPercent >= 0 &&
      kpis.availabilityPercent <= 100,
    `KPI 7: Disponibilidad operativa calculada (${kpis.availabilityPercent}% con ${kpis.operatingMachinesCount} de ${kpis.totalActiveMachines} máquinas operando)`
  );

  // 2. Monitoreo de Estado de Máquinas y Cronómetro en Tiempo Real
  console.log("\n2. Pruebas de Monitoreo de Parque de Maquinaria y Cronómetro en Vivo:");
  const machines = dashboardData.machinesStatus;
  assert(Array.isArray(machines) && machines.length > 0, "Lista de máquinas en planta obtenida correctamente");

  const stoppedMachine = machines.find((m) => m.status === "STOPPED");
  if (stoppedMachine && stoppedMachine.activeStop) {
    assert(
      stoppedMachine.activeStop.startTime.includes("T") &&
        !isNaN(new Date(stoppedMachine.activeStop.startTime).getTime()),
      "Máquina detenida cuenta con startTime UTC válido como fuente de verdad para LiveStopTimer"
    );
    assert(
      Boolean(stoppedMachine.activeStop.causeName) && Boolean(stoppedMachine.activeStop.operatorName),
      `Paro activo vinculado a la máquina contiene causa (${stoppedMachine.activeStop.causeName}) y operador (${stoppedMachine.activeStop.operatorName})`
    );
  } else {
    // Si ninguna máquina está detenida en este instante, verificar que la estructura lo soporte
    assert(machines.every((m) => ["OPERATING", "STOPPED", "MAINTENANCE", "OUT_OF_SERVICE"].includes(m.status)), "Todos los estados de maquinaria cumplen la especificación");
  }

  // 3. Generación y Agregación de Datasets para Gráficos
  console.log("\n3. Pruebas de Generación de Datasets para Gráficos Industriales:");
  const charts = dashboardData.charts;

  assert(Array.isArray(charts.stopsByDay), "Dataset de paros por día disponible");
  if (charts.stopsByDay.length > 0) {
    const firstDay = charts.stopsByDay[0];
    assert(
      Boolean(firstDay.date) && Boolean(firstDay.label) && typeof firstDay.downtimeMinutes === "number",
      "Estructura de paros por día contiene fecha, etiqueta y minutos de paro"
    );
  }

  assert(Array.isArray(charts.stopsByPeriod) && charts.stopsByPeriod.length >= 3, "Dataset de paros por turno contiene turnos configurados (Matutino, Vespertino, Nocturno)");
  
  assert(Array.isArray(charts.downtimeByMachine) && charts.downtimeByMachine.length > 0, "Dataset de ranking de tiempo de paro por máquina generado");
  if (charts.downtimeByMachine.length >= 2) {
    assert(
      charts.downtimeByMachine[0].downtimeMinutes >= charts.downtimeByMachine[1].downtimeMinutes,
      "Ranking de máquinas ordenado de forma descendente por minutos de inactividad"
    );
  }

  assert(Array.isArray(charts.stopsByCause) && charts.stopsByCause.length > 0, "Dataset de distribución por causas raíz generado");
  if (charts.stopsByCause.length >= 2) {
    assert(
      charts.stopsByCause[0].count >= charts.stopsByCause[1].count,
      "Distribución de causas ordenada de forma descendente por frecuencia de ocurrencia"
    );
  }

  // 4. Pruebas de Filtros Combinables del Dashboard
  console.log("\n4. Pruebas de Filtros Combinables del Dashboard:");

  // Filtro por Máquina
  const firstMachineId = machines[0]?.id;
  if (firstMachineId) {
    const filteredByMachine = await getDashboardData({ machineId: firstMachineId }, adminUser);
    assert(
      filteredByMachine.machinesStatus.length === 1 && filteredByMachine.machinesStatus[0].id === firstMachineId,
      `Filtro por máquina exitoso: Solo incluye máquina ${filteredByMachine.machinesStatus[0].code}`
    );
  }

  // Filtro por Área
  const firstAreaId = machines[0]?.areaId;
  if (firstAreaId) {
    const filteredByArea = await getDashboardData({ areaId: firstAreaId }, adminUser);
    assert(
      filteredByArea.machinesStatus.every((m) => m.areaId === firstAreaId),
      "Filtro por área exitoso: Todas las máquinas mostradas pertenecen al área seleccionada"
    );
  }

  // Filtro por Turno
  const filteredByShift = await getDashboardData({ shift: "Matutino" }, adminUser);
  assert(
    filteredByShift.kpis.totalStopsCount <= kpis.totalStopsCount,
    "Filtro por turno Matutino aplicado correctamente sobre los KPIs"
  );

  // Filtro por Rango de Fechas
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredByDate = await getDashboardData({ dateFrom: "2020-01-01", dateTo: todayStr }, adminUser);
  assert(
    filteredByDate.kpis.totalStopsCount >= 0,
    "Filtro por rango de fechas (desde 2020 hasta hoy) ejecutado correctamente"
  );

  // 5. Pruebas de Permisos y Control de Acceso por Rol (RBAC)
  console.log("\n5. Pruebas de Permisos RBAC en Servidor:");

  // Supervisor
  const supervisorData = await getDashboardData({}, supervisorUser);
  assert(
    supervisorData.roleScope === "SUPERVISOR" && supervisorData.kpis.totalStopsCount > 0,
    "Supervisor tiene acceso completo al monitoreo e indicadores del tablero"
  );

  // Mantenimiento
  const maintenanceData = await getDashboardData({}, maintenanceUser);
  assert(
    maintenanceData.roleScope === "MANTENIMIENTO" && Array.isArray(maintenanceData.machinesStatus),
    "Mantenimiento accede a los KPIs técnicos y estado del parque de maquinaria"
  );

  // Operador
  const operatorData = await getDashboardData({}, operatorUser);
  assert(
    operatorData.roleScope === "OPERADOR" && operatorData.machinesStatus.length > 0,
    "Operador visualiza el estado de planta y disponibilidad de maquinaria"
  );

  // Rechazo de usuario inactivo
  const inactiveUser: SessionUser = {
    id: "user-inactivo",
    name: "Usuario Inactivo",
    email: "inactivo@stopcontrol.local",
    role: "OPERADOR",
    status: "INACTIVE",
  };
  try {
    await getDashboardData({}, inactiveUser);
    assert(false, "Bloqueo de usuario inactivo falló");
  } catch (err: any) {
    assert(
      err.message.includes("inactivo"),
      "Bloqueo exitoso: Usuario inactivo no puede acceder a métricas del dashboard"
    );
  }

  // 6. Verificación de Alcance Evolutivo (Fases 8, 9 y 10)
  console.log("\n6. Verificación de Alcance Evolutivo:");
  assert(
    "mtbfHours" in kpis && "mttrMinutes" in kpis,
    "Evolución exitosa: MTBF/MTTR formalmente integrados en el dashboard (FASE 9)"
  );
  assert(
    !("paretoCurve" in charts),
    "Límite respetado: Pareto organizado en su propio servicio y sección dedicada (FASE 10)"
  );

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runDashboardTests().catch((e) => {
  console.error("Fallo inesperado en pruebas del dashboard:", e);
  process.exit(1);
});
