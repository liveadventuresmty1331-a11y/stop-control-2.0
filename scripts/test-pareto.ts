import {
  calculatePareto,
  generateDashboardPareto,
  RawParetoInput,
  GenericStopForPareto,
  GenericMachineForPareto,
} from "../lib/pareto-service";
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

async function runParetoTests() {
  console.log("==========================================");
  console.log("INICIANDO SUITE DE PRUEBAS: FASE 10 - DIAGRAMAS DE PARETO (80/20)");
  console.log("==========================================\n");

  const adminUser: SessionUser = {
    id: "user-1",
    name: "Carlos Mendoza (Admin)",
    email: "admin@stopcontrol.local",
    role: "ADMINISTRADOR",
    status: "ACTIVE",
  };

  // ----------------------------------------------------
  // 1. Gráfica de Pareto de causas ordenada de mayor a menor frecuencia
  // ----------------------------------------------------
  console.log("1. Pareto de causas ordenadas de mayor a menor frecuencia:");
  const sampleCauses: RawParetoInput[] = [
    { id: "c1", name: "Falta de lubricación", value: 4 },
    { id: "c2", name: "Atasco mecánico", value: 15 },
    { id: "c3", name: "Falla eléctrica sensor", value: 30 },
    { id: "c4", name: "Desajuste de troquel", value: 8 },
  ];

  const paretoCauses = calculatePareto(sampleCauses, {
    analysisType: "CAUSES_FREQUENCY",
    title: "Pareto de Causas de Paro",
    subtitle: "Distribución por frecuencia",
    unitLabel: "paros",
  });

  assert(paretoCauses.items.length === 4, "Genera 4 elementos analizados");
  assert(paretoCauses.items[0].name === "Falla eléctrica sensor" && paretoCauses.items[0].value === 30, "El primer elemento es la causa con mayor frecuencia (30)");
  assert(paretoCauses.items[1].name === "Atasco mecánico" && paretoCauses.items[1].value === 15, "El segundo elemento es Atasco mecánico (15)");
  assert(paretoCauses.items[2].name === "Desajuste de troquel" && paretoCauses.items[2].value === 8, "El tercer elemento es Desajuste de troquel (8)");
  assert(paretoCauses.items[3].name === "Falta de lubricación" && paretoCauses.items[3].value === 4, "El cuarto elemento es Falta de lubricación (4)");

  // ----------------------------------------------------
  // 2. Gráfica de Pareto de máquinas por cantidad de paros ordenada de mayor a menor
  // ----------------------------------------------------
  console.log("\n2. Pareto de máquinas por cantidad de paros (frecuencia):");
  const sampleMachineFreq: RawParetoInput[] = [
    { id: "m1", code: "EXT-01", name: "Extrusora 01", value: 5 },
    { id: "m2", code: "CNC-01", name: "Centro de Maquinado CNC", value: 20 },
    { id: "m3", code: "INY-02", name: "Inyectora de Plástico 02", value: 12 },
  ];

  const paretoMachineFreq = calculatePareto(sampleMachineFreq, {
    analysisType: "MACHINES_FREQUENCY",
    title: "Pareto de Máquinas por Frecuencia",
    subtitle: "Cantidad de eventos",
    unitLabel: "paros",
  });

  assert(paretoMachineFreq.items[0].code === "CNC-01" && paretoMachineFreq.items[0].value === 20, "Máquina con mayor frecuencia es CNC-01 (20 paros)");
  assert(paretoMachineFreq.items[1].code === "INY-02" && paretoMachineFreq.items[1].value === 12, "Segunda máquina es INY-02 (12 paros)");
  assert(paretoMachineFreq.items[2].code === "EXT-01" && paretoMachineFreq.items[2].value === 5, "Tercera máquina es EXT-01 (5 paros)");

  // ----------------------------------------------------
  // 3. Gráfica de Pareto de máquinas por tiempo total de paro ordenada de mayor a menor
  // ----------------------------------------------------
  console.log("\n3. Pareto de máquinas por tiempo total de paro (downtime en minutos):");
  const sampleMachineTime: RawParetoInput[] = [
    { id: "m1", code: "EXT-01", name: "Extrusora 01", value: 350 }, // 350 min
    { id: "m2", code: "CNC-01", name: "Centro de Maquinado CNC", value: 120 }, // 120 min
    { id: "m3", code: "INY-02", name: "Inyectora de Plástico 02", value: 600 }, // 600 min
  ];

  const paretoMachineTime = calculatePareto(sampleMachineTime, {
    analysisType: "MACHINES_DOWNTIME",
    title: "Pareto de Máquinas por Tiempo de Paro",
    subtitle: "Downtime acumulado",
    unitLabel: "minutos",
  });

  assert(paretoMachineTime.items[0].code === "INY-02" && paretoMachineTime.items[0].value === 600, "Máquina con mayor tiempo es INY-02 (600 min / 10h)");
  assert(paretoMachineTime.items[1].code === "EXT-01" && paretoMachineTime.items[1].value === 350, "Segunda máquina con mayor tiempo es EXT-01 (350 min)");
  assert(paretoMachineTime.items[2].code === "CNC-01" && paretoMachineTime.items[2].value === 120, "Tercera máquina con mayor tiempo es CNC-01 (120 min)");
  assert(paretoMachineTime.items[0].formattedValue.includes("h") || paretoMachineTime.items[0].formattedValue.includes("min"), "Valor formateado en horas/minutos legible");

  // ----------------------------------------------------
  // 4. Cálculo correcto de porcentaje individual en cada barra
  // ----------------------------------------------------
  console.log("\n4. Cálculo correcto de porcentajes individuales:");
  // Total = 30 + 15 + 8 + 4 = 57
  // c3 (30): 30/57 = 52.6%
  // c2 (15): 15/57 = 26.3%
  // c4 (8): 8/57 = 14.0%
  // c1 (4): 4/57 = 7.0%
  assert(paretoCauses.items[0].percentage === 52.6, "Porcentaje individual c3 es 52.6%");
  assert(paretoCauses.items[1].percentage === 26.3, "Porcentaje individual c2 es 26.3%");
  assert(paretoCauses.items[2].percentage === 14.0, "Porcentaje individual c4 es 14.0%");
  assert(paretoCauses.items[3].percentage === 7.0, "Porcentaje individual c1 es 7.0%");

  // ----------------------------------------------------
  // 5. Cálculo correcto de porcentaje acumulado (iniciando en primer elemento y terminando en 100%)
  // ----------------------------------------------------
  console.log("\n5. Cálculo correcto de porcentaje acumulado progresivo:");
  assert(paretoCauses.items[0].cumulativePercentage === 52.6, "Acumulado #1 coincide con individual #1 (52.6%)");
  assert(paretoCauses.items[1].cumulativePercentage === 78.9, "Acumulado #2 es 52.6 + 26.3 = 78.9%");
  assert(paretoCauses.items[2].cumulativePercentage === 93.0, "Acumulado #3 es 53/57 = 93.0%");
  assert(paretoCauses.items[3].cumulativePercentage === 100.0, "Acumulado final #4 es exactamente 100.0%");

  // ----------------------------------------------------
  // 6. Identificación visual clara del punto de corte del 80% (Pocos Vitales vs Muchos Triviales)
  // ----------------------------------------------------
  console.log("\n6. Identificación del corte 80% (Vital Few):");
  // En paretoCauses:
  // Item 0: 52.6% (<= 80) -> isVitalFew = true
  // Item 1: 78.9% (<= 80) -> isVitalFew = true
  // Item 2: 92.9% (primer elemento que cruza 80% -> incluye para completar el corte 80/20) -> isVitalFew = true
  // Item 3: 100% -> isVitalFew = false
  assert(paretoCauses.vitalFewCount >= 2, "Identifica correctamente los pocos vitales");
  assert(paretoCauses.items[0].isVitalFew === true, "Item #1 (52.6%) marcado como vital");
  assert(paretoCauses.items[1].isVitalFew === true, "Item #2 (78.9%) marcado como vital");
  assert(paretoCauses.items[3].isVitalFew === false, "Item #4 (100.0%) marcado como trivial");

  // ----------------------------------------------------
  // 7. Diferenciación visual y conceptual entre frecuencia y tiempo de paro
  // ----------------------------------------------------
  console.log("\n7. Diferenciación entre Pareto por Frecuencia y Pareto por Tiempo de Paro:");
  assert(
    paretoMachineFreq.analysisType === "MACHINES_FREQUENCY" && paretoMachineTime.analysisType === "MACHINES_DOWNTIME",
    "analysisType distingue explícitamente FREQUENCY y DOWNTIME"
  );
  assert(paretoMachineFreq.unitLabel === "paros", "Frecuencia tiene unidad 'paros'");
  assert(paretoMachineTime.unitLabel === "minutos", "Downtime tiene unidad 'minutos'");
  assert(paretoMachineFreq.items[0].code !== paretoMachineTime.items[0].code, "La máquina #1 en frecuencia (CNC-01) difiere de la #1 en tiempo (INY-02)");

  // ----------------------------------------------------
  // 8. Integración con generateDashboardPareto y exclusión de paros ACTIVE
  // ----------------------------------------------------
  console.log("\n8. Integración con generador y exclusión de paros ACTIVE:");
  const testStops: GenericStopForPareto[] = [
    {
      id: "s1",
      machineId: "m1",
      machine: { id: "m1", code: "M-01", name: "Torno 1" },
      causeId: "c1",
      cause: { id: "c1", name: "Falla Hidráulica" },
      duration: 100,
      status: "COMPLETED",
    },
    {
      id: "s2",
      machineId: "m1",
      machine: { id: "m1", code: "M-01", name: "Torno 1" },
      causeId: "c1",
      cause: { id: "c1", name: "Falla Hidráulica" },
      duration: 50,
      status: "COMPLETED",
    },
    {
      id: "s3",
      machineId: "m2",
      machine: { id: "m2", code: "M-02", name: "Fresadora 2" },
      causeId: "c2",
      cause: { id: "c2", name: "Desgaste de Herramienta" },
      duration: 40,
      status: "COMPLETED",
    },
    {
      // Paro ACTIVE - DEBE SER EXCLUIDO
      id: "s-active",
      machineId: "m2",
      machine: { id: "m2", code: "M-02", name: "Fresadora 2" },
      causeId: "c2",
      cause: { id: "c2", name: "Desgaste de Herramienta" },
      duration: null,
      status: "ACTIVE",
    },
  ];

  const testMachines: GenericMachineForPareto[] = [
    { id: "m1", code: "M-01", name: "Torno 1", active: true },
    { id: "m2", code: "M-02", name: "Fresadora 2", active: true },
    { id: "m3", code: "M-03", name: "Prensa 3", active: true },
  ];

  const generated = generateDashboardPareto(testStops, testMachines);

  assert(generated.causesByFrequency.totalValue === 3, "Total de causas suma exactamente 3 paros (excluye el ACTIVE)");
  assert(generated.machinesByFrequency.totalValue === 3, "Total de máquinas suma 3 paros (excluye el ACTIVE)");
  assert(generated.machinesByDowntime.totalValue === 190, "Total de minutos suma 100 + 50 + 40 = 190 minutos");
  assert(generated.causesByFrequency.items[0].name === "Falla Hidráulica" && generated.causesByFrequency.items[0].value === 2, "Causa líder es Falla Hidráulica con 2 paros");

  // ----------------------------------------------------
  // 9. Comportamiento cuando no hay datos (filtros vacíos)
  // ----------------------------------------------------
  console.log("\n9. Comportamiento seguro con dataset vacío o filtros sin coincidencias:");
  const emptyResult = generateDashboardPareto([], testMachines);

  assert(emptyResult.causesByFrequency.isEmpty === true, "causesByFrequency marca isEmpty = true");
  assert(emptyResult.causesByFrequency.totalValue === 0, "totalValue es 0");
  assert(emptyResult.causesByFrequency.items.length === 0, "items es array vacío");
  assert(emptyResult.machinesByFrequency.isEmpty === true, "machinesByFrequency marca isEmpty = true");
  assert(emptyResult.machinesByDowntime.isEmpty === true, "machinesByDowntime marca isEmpty = true");

  // ----------------------------------------------------
  // 10. Robustez matemática: Sin NaN, Infinity ni números negativos
  // ----------------------------------------------------
  console.log("\n10. Ausencia de NaN, Infinity y números negativos:");
  const singleItem = calculatePareto([{ id: "only", name: "Única Causa", value: 10 }], {
    analysisType: "CAUSES_FREQUENCY",
    title: "Único elemento",
    subtitle: "Prueba 1 solo item",
    unitLabel: "paro",
  });

  assert(singleItem.items[0].percentage === 100, "1 solo elemento tiene 100% individual");
  assert(singleItem.items[0].cumulativePercentage === 100, "1 solo elemento tiene 100% acumulado");
  assert(!Number.isNaN(singleItem.items[0].percentage), "Porcentaje no es NaN");
  assert(Number.isFinite(singleItem.items[0].percentage), "Porcentaje es finito");

  // ----------------------------------------------------
  // 11. Suma de porcentajes individuales totaliza ~100% y acumulado final es 100%
  // ----------------------------------------------------
  console.log("\n11. Verificación de suma de porcentajes y acumulado final:");
  const sumPercentages = paretoCauses.items.reduce((acc, curr) => acc + curr.percentage, 0);
  assert(
    sumPercentages >= 99.8 && sumPercentages <= 100.2,
    `Suma de porcentajes individuales está en rango normal de redondeo: ${sumPercentages}%`
  );
  assert(
    paretoCauses.items[paretoCauses.items.length - 1].cumulativePercentage === 100,
    "El porcentaje acumulado final es exactamente 100%"
  );
  assert(
    paretoMachineTime.items[paretoMachineTime.items.length - 1].cumulativePercentage === 100,
    "El porcentaje acumulado final de downtime es exactamente 100%"
  );

  // ----------------------------------------------------
  // 12. Integración completa con getDashboardData
  // ----------------------------------------------------
  console.log("\n12. Integración con servicio principal getDashboardData:");
  const dashboardData = await getDashboardData({}, adminUser);

  assert(dashboardData.pareto !== undefined, "dashboardData incluye propiedad pareto");
  assert(dashboardData.pareto.causesByFrequency !== undefined, "pareto incluye causesByFrequency");
  assert(dashboardData.pareto.machinesByFrequency !== undefined, "pareto incluye machinesByFrequency");
  assert(dashboardData.pareto.machinesByDowntime !== undefined, "pareto incluye machinesByDowntime");

  console.log(`     • Causas evaluadas: ${dashboardData.pareto.causesByFrequency.itemsCount}`);
  console.log(`     • Máquinas evaluadas (frecuencia): ${dashboardData.pareto.machinesByFrequency.itemsCount}`);
  console.log(`     • Máquinas evaluadas (downtime): ${dashboardData.pareto.machinesByDowntime.itemsCount}`);

  if (!dashboardData.pareto.causesByFrequency.isEmpty) {
    console.log(
      `     • Causa líder en planta: ${dashboardData.pareto.causesByFrequency.items[0].name} (${dashboardData.pareto.causesByFrequency.items[0].value} paros, ${dashboardData.pareto.causesByFrequency.items[0].percentage}%)`
    );
  }

  // ----------------------------------------------------
  // 13. Verificación con filtros en getDashboardData
  // ----------------------------------------------------
  console.log("\n13. Filtrado dinámico en getDashboardData:");
  const filteredDashboard = await getDashboardData({ shift: "Matutino" }, adminUser);
  assert(filteredDashboard.pareto !== undefined, "Dashboard filtrado por turno responde con objeto pareto");
  assert(
    filteredDashboard.pareto.causesByFrequency.totalValue <= dashboardData.pareto.causesByFrequency.totalValue,
    "Subconjunto filtrado tiene igual o menor cantidad de paros que el total"
  );

  // ----------------------------------------------------
  // Resumen Final
  // ----------------------------------------------------
  console.log("\n==========================================");
  console.log(`RESULTADOS: ${passedTests} de ${totalTests} pruebas pasaron satisfactoriamente.`);
  if (passedTests === totalTests) {
    console.log("🎉 TODAS LAS 16 VERIFICACIONES DE FASE 10 HAN SIDO SUPERADAS CON ÉXITO.");
  } else {
    console.error("⚠️ SE DETECTARON FALLOS EN LA SUITE DE PRUEBAS DE FASE 10.");
  }
  console.log("==========================================\n");
}

runParetoTests().catch((err) => {
  console.error("Error fatal ejecutando pruebas de Pareto:", err);
  process.exit(1);
});
