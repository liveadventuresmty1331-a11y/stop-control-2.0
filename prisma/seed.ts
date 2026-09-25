import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de STOPControl 2.0...");

  // 1. Roles del Sistema
  console.log("-> Creando Roles...");
  const rolesData = [
    { name: "ADMINISTRADOR", description: "Control total de catálogos, usuarios e indicadores" },
    { name: "OPERADOR", description: "Registro, inicio y finalización de paros en planta" },
    { name: "SUPERVISOR", description: "Monitoreo en vivo de paros, dashboard e historial" },
    { name: "MANTENIMIENTO", description: "Atención de órdenes de trabajo, análisis MTTR/MTBF" },
  ];

  const rolesMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    rolesMap.set(role.name, role.id);
  }

  // 2. Áreas
  console.log("-> Creando Áreas...");
  const areasData = [
    { name: "Producción", description: "Líneas principales de mecanizado y corte" },
    { name: "Soldadura", description: "Estaciones de soldadura manual y robótica" },
    { name: "Ensamble", description: "Líneas de ensamble e integración" },
    { name: "Pintura", description: "Cabinas de preparación y acabado superficial" },
  ];

  const areasMap = new Map<string, string>();
  for (const a of areasData) {
    const area = await prisma.area.upsert({
      where: { name: a.name },
      update: { description: a.description },
      create: a,
    });
    areasMap.set(area.name, area.id);
  }

  // 3. Procesos
  console.log("-> Creando Procesos...");
  const processesData = ["Corte", "Soldadura", "Ensamble", "Pintura"];
  const processesMap = new Map<string, string>();
  for (const p of processesData) {
    const proc = await prisma.process.upsert({
      where: { name: p },
      update: {},
      create: { name: p },
    });
    processesMap.set(proc.name, proc.id);
  }

  // 4. Tipos de Paro
  console.log("-> Creando Tipos de Paro...");
  const stopTypesData = [
    { name: "Planeado", description: "Mantenimiento preventivo, limpieza o ajustes programados" },
    { name: "No planeado", description: "Averías imprevistas, fallas mecánicas, eléctricas o falta de insumos" },
  ];
  const stopTypesMap = new Map<string, string>();
  for (const st of stopTypesData) {
    const stopType = await prisma.stopType.upsert({
      where: { name: st.name },
      update: { description: st.description },
      create: st,
    });
    stopTypesMap.set(stopType.name, stopType.id);
  }

  // 5. Causas de Paro
  console.log("-> Creando Causas de Paro...");
  const causesData = [
    { name: "Falla mecánica", isRepairable: true },
    { name: "Falla eléctrica", isRepairable: true },
    { name: "Falta de material", isRepairable: false },
    { name: "Mantenimiento", isRepairable: false },
    { name: "Ajuste", isRepairable: false },
    { name: "Error humano", isRepairable: false },
    { name: "Calidad", isRepairable: false },
    { name: "Otra", isRepairable: false },
  ];
  const causesMap = new Map<string, string>();
  for (const c of causesData) {
    const cause = await prisma.stopCause.upsert({
      where: { name: c.name },
      update: { isRepairable: c.isRepairable },
      create: c,
    });
    causesMap.set(cause.name, cause.id);
  }

  // 6. Prioridades
  console.log("-> Creando Prioridades...");
  const prioritiesData = [
    { name: "Baja", level: 1, colorCode: "#3b82f6" },
    { name: "Media", level: 2, colorCode: "#eab308" },
    { name: "Alta", level: 3, colorCode: "#f97316" },
    { name: "Crítica", level: 4, colorCode: "#ef4444" },
  ];
  const prioritiesMap = new Map<string, string>();
  for (const pr of prioritiesData) {
    const priority = await prisma.priority.upsert({
      where: { name: pr.name },
      update: { level: pr.level, colorCode: pr.colorCode },
      create: pr,
    });
    prioritiesMap.set(priority.name, priority.id);
  }

  // 7. Máquinas Iniciales
  console.log("-> Creando Máquinas...");
  const machinesData = [
    { code: "CNC-01", name: "Torno CNC", areaName: "Producción", status: "STOPPED" },
    { code: "CNC-02", name: "Torno CNC", areaName: "Producción", status: "OPERATING" },
    { code: "SOLD-01", name: "Soldadora", areaName: "Soldadura", status: "OPERATING" },
    { code: "ENS-01", name: "Línea de Ensamble", areaName: "Ensamble", status: "OPERATING" },
    { code: "PINT-01", name: "Cabina de Pintura", areaName: "Pintura", status: "OPERATING" },
  ];
  const machinesMap = new Map<string, string>();
  for (const m of machinesData) {
    const areaId = areasMap.get(m.areaName);
    if (!areaId) continue;
    const machine = await prisma.machine.upsert({
      where: { code: m.code },
      update: { name: m.name, areaId, status: m.status },
      create: { code: m.code, name: m.name, areaId, status: m.status, active: true },
    });
    machinesMap.set(machine.code, machine.id);
  }

  // 8. Usuarios de Prueba
  console.log("-> Creando Usuarios de Prueba...");
  const salt = await bcrypt.genSalt(10);
  const demoHashedPassword = await bcrypt.hash("demo123", salt);

  const demoUsers = [
    {
      name: "Carlos Mendoza (Admin)",
      email: "admin@stopcontrol.local",
      roleName: "ADMINISTRADOR",
    },
    {
      name: "Juan Pérez (Operador)",
      email: "operador@stopcontrol.local",
      roleName: "OPERADOR",
    },
    {
      name: "Roberto Gómez (Supervisor)",
      email: "supervisor@stopcontrol.local",
      roleName: "SUPERVISOR",
    },
    {
      name: "Laura Ramos (Mantenimiento)",
      email: "mantenimiento@stopcontrol.local",
      roleName: "MANTENIMIENTO",
    },
  ];

  const usersMap = new Map<string, string>();
  for (const u of demoUsers) {
    const roleId = rolesMap.get(u.roleName);
    if (!roleId) continue;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roleId, status: "ACTIVE" },
      create: {
        name: u.name,
        email: u.email,
        password: demoHashedPassword,
        roleId,
        status: "ACTIVE",
      },
    });
    usersMap.set(u.email, user.id);
  }

  // 9. Histórico de Paros de Demostración (para KPIs, Pareto y MTTR/MTBF)
  console.log("-> Creando Histórico de Paros...");
  const operatorId = usersMap.get("operador@stopcontrol.local")!;
  const technicianId = usersMap.get("mantenimiento@stopcontrol.local")!;
  const now = new Date();

  // Historial de eventos cerrados (COMPLETED)
  const historicalEvents = [
    {
      machineCode: "CNC-01",
      areaName: "Producción",
      processName: "Corte",
      stopTypeName: "No planeado",
      causeName: "Falla mecánica",
      priorityName: "Alta",
      hoursAgoStart: 72,
      durationMinutes: 75,
      observations: "Desgaste de rodamiento en husillo principal",
      actionTaken: "Sustitución de rodamiento y lubricación de bancada",
      otCode: "OT-2026-0001",
    },
    {
      machineCode: "CNC-02",
      areaName: "Producción",
      processName: "Corte",
      stopTypeName: "No planeado",
      causeName: "Falla eléctrica",
      priorityName: "Crítica",
      hoursAgoStart: 48,
      durationMinutes: 45,
      observations: "Disparo de disyuntor por sobrecarga térmica",
      actionTaken: "Rebalanceo de fases y sustitución de relevador térmico",
      otCode: "OT-2026-0002",
    },
    {
      machineCode: "SOLD-01",
      areaName: "Soldadura",
      processName: "Soldadura",
      stopTypeName: "No planeado",
      causeName: "Falta de material",
      priorityName: "Media",
      hoursAgoStart: 36,
      durationMinutes: 30,
      observations: "Agotamiento de gas argón en línea de suministro",
      actionTaken: "Cambio de cilindro y purga de antorcha",
      otCode: "OT-2026-0003",
    },
    {
      machineCode: "ENS-01",
      areaName: "Ensamble",
      processName: "Ensamble",
      stopTypeName: "Planeado",
      causeName: "Mantenimiento",
      priorityName: "Baja",
      hoursAgoStart: 24,
      durationMinutes: 60,
      observations: "Mantenimiento preventivo quincenal",
      actionTaken: "Limpieza de guías, ajuste de sensores fotoeléctricos",
      otCode: "OT-2026-0004",
    },
    {
      machineCode: "CNC-01",
      areaName: "Producción",
      processName: "Corte",
      stopTypeName: "No planeado",
      causeName: "Falla mecánica",
      priorityName: "Alta",
      hoursAgoStart: 12,
      durationMinutes: 50,
      observations: "Fuga de aceite en unidad hidráulica",
      actionTaken: "Sustitución de sello y o-ring de manguera de alta presión",
      otCode: "OT-2026-0005",
    },
  ];

  for (const ev of historicalEvents) {
    const startTime = new Date(now.getTime() - ev.hoursAgoStart * 3600 * 1000);
    const endTime = new Date(startTime.getTime() + ev.durationMinutes * 60 * 1000);
    const duration = ev.durationMinutes * 60;

    const stop = await prisma.stop.create({
      data: {
        machineId: machinesMap.get(ev.machineCode)!,
        operatorId,
        technicianId,
        areaId: areasMap.get(ev.areaName)!,
        processId: processesMap.get(ev.processName)!,
        stopTypeId: stopTypesMap.get(ev.stopTypeName)!,
        causeId: causesMap.get(ev.causeName)!,
        priorityId: prioritiesMap.get(ev.priorityName)!,
        startTime,
        endTime,
        duration,
        observations: ev.observations,
        actionTaken: ev.actionTaken,
        status: "COMPLETED",
        shift: "TURNO_1",
      },
    });

    await prisma.workOrder.create({
      data: {
        code: ev.otCode,
        status: "COMPLETED",
        notes: `Atendida por ${ev.actionTaken}`,
        stopId: stop.id,
      },
    });
  }

  // 10. Paro ACTIVO (para demostrar el cronómetro en vivo en CNC-01)
  console.log("-> Creando Paro Activo de demostración...");
  const activeStartTime = new Date(now.getTime() - 25 * 60 * 1000); // Iniciado hace 25 minutos

  // Verificar si ya existe un paro activo en CNC-01
  const existingActive = await prisma.stop.findFirst({
    where: {
      machineId: machinesMap.get("CNC-01")!,
      status: "ACTIVE",
    },
  });

  if (!existingActive) {
    const activeStop = await prisma.stop.create({
      data: {
        machineId: machinesMap.get("CNC-01")!,
        operatorId,
        areaId: areasMap.get("Producción")!,
        processId: processesMap.get("Corte")!,
        stopTypeId: stopTypesMap.get("No planeado")!,
        causeId: causesMap.get("Falla mecánica")!,
        priorityId: prioritiesMap.get("Alta")!,
        startTime: activeStartTime,
        endTime: null,
        duration: null,
        observations: "Ruido anormal y vibración en torreta de herramientas",
        status: "ACTIVE",
        shift: "TURNO_1",
      },
    });

    await prisma.workOrder.create({
      data: {
        code: "OT-2026-0006",
        status: "IN_PROGRESS",
        notes: "Inspección técnica requerida en torreta",
        stopId: activeStop.id,
      },
    });
  }

  console.log("✅ Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
