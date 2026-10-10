import { db } from "./db";
import { SessionUser } from "./auth";
import { getAllCatalogs, memoryStore } from "./catalogs-service";
import { syncStopCreated, syncStopCompleted, syncWorkOrder } from "./google-sheets";

export interface CreateStopInput {
  machineId: string;
  areaId: string;
  processId: string;
  stopTypeId: string;
  causeId: string;
  priorityId: string;
  shift: string; // Matutino | Vespertino | Nocturno
  observations?: string;
}

export interface CloseStopInput {
  actionTaken: string;
  technicianId?: string | null;
}

export interface HistoryQueryFilters {
  dateFrom?: string;
  dateTo?: string;
  machineId?: string;
  areaId?: string;
  processId?: string;
  stopTypeId?: string;
  causeId?: string;
  priorityId?: string;
  shift?: string;
  status?: string; // "COMPLETED" | "ACTIVE" | "ALL"
  search?: string;
  sortBy?: "startTime" | "duration" | "machine";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StopQueryResultItem {
  id: string;
  machineId: string;
  machine?: { code?: string; name?: string; status?: string; area?: { name?: string } };
  areaId: string;
  area?: { name?: string };
  processId: string;
  process?: { name?: string };
  stopTypeId: string;
  stopType?: { name?: string };
  causeId: string;
  cause?: { name?: string; isRepairable?: boolean };
  priorityId: string;
  priority?: { name?: string; colorCode?: string | null; level?: number };
  operatorId: string;
  operator?: { id?: string; name?: string; email?: string };
  technicianId?: string | null;
  technician?: { id?: string; name?: string; email?: string } | null;
  workOrder?: { id?: string; code?: string; status?: string; notes?: string | null; createdAt?: Date | string } | null;
  shift?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration?: number | null;
  observations?: string | null;
  actionTaken?: string | null;
  status: string;
  createdAt?: Date | string;
}

export interface HistoryQueryResult {
  stops: StopQueryResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemoryWorkOrder {
  id: string;
  code: string;
  status: string;
  notes?: string | null;
  stopId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStop {
  id: string;
  machineId: string;
  machine?: { id?: string; code?: string; name?: string; status?: string; active?: boolean };
  operatorId: string;
  operator?: { id?: string; name?: string; email?: string };
  technicianId?: string | null;
  technician?: { id?: string; name?: string; email?: string } | null;
  workOrder?: MemoryWorkOrder | null;
  areaId: string;
  area?: { id?: string; name?: string };
  processId: string;
  process?: { id?: string; name?: string };
  stopTypeId: string;
  stopType?: { id?: string; name?: string };
  causeId: string;
  cause?: { id?: string; name?: string; isRepairable?: boolean };
  priorityId: string;
  priority?: { id?: string; name?: string; colorCode?: string; level?: number };
  startTime: string;
  endTime: string | null;
  duration: number | null;
  observations?: string | null;
  actionTaken?: string | null;
  status: string;
  shift: string;
  createdAt: string;
}

// Almacén en memoria de órdenes de trabajo para respaldo
const memoryWorkOrders: MemoryWorkOrder[] = [
  {
    id: "wo-1",
    code: "OT-2026-0001",
    status: "COMPLETED",
    notes: "Alineación de husillo",
    stopId: "stop-hist-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wo-2",
    code: "OT-2026-0002",
    status: "COMPLETED",
    notes: "Reemplazo de bobina",
    stopId: "stop-hist-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wo-3",
    code: "OT-2026-0003",
    status: "COMPLETED",
    notes: "Ajuste de servomotor",
    stopId: "stop-hist-3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wo-4",
    code: "OT-2026-0004",
    status: "COMPLETED",
    notes: "Limpieza de guías y sensores",
    stopId: "stop-hist-4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wo-5",
    code: "OT-2026-0005",
    status: "COMPLETED",
    notes: "Sustitución de sello y o-ring",
    stopId: "stop-hist-5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Almacén en memoria de paros para respaldo cuando PostgreSQL no esté disponible localmente
const nowMs = Date.now();
const memoryStops: MemoryStop[] = [
  {
    id: "stop-active-demo",
    machineId: "mach-1",
    machine: { id: "mach-1", code: "CNC-01", name: "Torno CNC", status: "STOPPED", active: true },
    operatorId: "user-2",
    operator: { id: "user-2", name: "Juan Pérez (Operador)", email: "operador@stopcontrol.local" },
    areaId: "area-1",
    area: { id: "area-1", name: "Producción" },
    processId: "proc-1",
    process: { id: "proc-1", name: "Corte" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-1",
    cause: { id: "cause-1", name: "Falla mecánica", isRepairable: true },
    priorityId: "priority-3",
    priority: { id: "priority-3", name: "Alta", colorCode: "#f97316", level: 3 },
    startTime: new Date(nowMs - 25 * 60 * 1000).toISOString(),
    endTime: null,
    duration: null,
    observations: "Ruido anormal y vibración en torreta de herramientas",
    actionTaken: null,
    status: "ACTIVE",
    shift: "Matutino",
    createdAt: new Date(nowMs - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "stop-hist-0",
    machineId: "mach-1",
    machine: { id: "mach-1", code: "CNC-01", name: "Torno CNC", status: "OPERATING", active: true },
    operatorId: "user-2",
    operator: { id: "user-2", name: "Juan Pérez (Operador)", email: "operador@stopcontrol.local" },
    technicianId: "user-4",
    technician: { id: "user-4", name: "Laura Ramos (Mantenimiento)", email: "mantenimiento@stopcontrol.local" },
    workOrder: null,
    areaId: "area-1",
    area: { id: "area-1", name: "Producción" },
    processId: "proc-1",
    process: { id: "proc-1", name: "Corte" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-1",
    cause: { id: "cause-1", name: "Falla mecánica", isRepairable: true },
    priorityId: "priority-3",
    priority: { id: "priority-3", name: "Alta", colorCode: "#f97316", level: 3 },
    startTime: new Date(nowMs - 72 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 72 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
    duration: 45,
    observations: "Falla en sistema hidráulico de mordaza",
    actionTaken: "Purga de aire y cambio de válvula reguladora",
    status: "COMPLETED",
    shift: "Matutino",
    createdAt: new Date(nowMs - 72 * 3600 * 1000).toISOString(),
  },
  {
    id: "stop-hist-1",
    machineId: "mach-1",
    machine: { id: "mach-1", code: "CNC-01", name: "Torno CNC", status: "OPERATING", active: true },
    operatorId: "user-2",
    operator: { id: "user-2", name: "Juan Pérez (Operador)", email: "operador@stopcontrol.local" },
    technicianId: "user-4",
    technician: { id: "user-4", name: "Laura Ramos (Mantenimiento)", email: "mantenimiento@stopcontrol.local" },
    workOrder: memoryWorkOrders[0],
    areaId: "area-1",
    area: { id: "area-1", name: "Producción" },
    processId: "proc-1",
    process: { id: "proc-1", name: "Corte" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-1",
    cause: { id: "cause-1", name: "Falla mecánica", isRepairable: true },
    priorityId: "priority-3",
    priority: { id: "priority-3", name: "Alta", colorCode: "#f97316", level: 3 },
    startTime: new Date(nowMs - 48 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 48 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
    duration: 45,
    observations: "Sobrecalentamiento en rodamiento frontal",
    actionTaken: "Alineación de husillo y lubricación de alta velocidad",
    status: "COMPLETED",
    shift: "Matutino",
    createdAt: new Date(nowMs - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "stop-hist-2",
    machineId: "mach-3",
    machine: { id: "mach-3", code: "SOLD-01", name: "Soldadora", status: "OPERATING", active: true },
    operatorId: "user-2",
    operator: { id: "user-2", name: "Juan Pérez (Operador)", email: "operador@stopcontrol.local" },
    technicianId: "user-4",
    technician: { id: "user-4", name: "Laura Ramos (Mantenimiento)", email: "mantenimiento@stopcontrol.local" },
    workOrder: memoryWorkOrders[1],
    areaId: "area-2",
    area: { id: "area-2", name: "Soldadura" },
    processId: "proc-2",
    process: { id: "proc-2", name: "Soldadura" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-2",
    cause: { id: "cause-2", name: "Falla eléctrica", isRepairable: true },
    priorityId: "priority-2",
    priority: { id: "priority-2", name: "Media", colorCode: "#eab308", level: 2 },
    startTime: new Date(nowMs - 36 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 36 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    duration: 30,
    observations: "Arco intermitente en devanado secundario",
    actionTaken: "Reemplazo de bobina y contactor de potencia",
    status: "COMPLETED",
    shift: "Vespertino",
    createdAt: new Date(nowMs - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: "stop-hist-3",
    machineId: "mach-2",
    machine: { id: "mach-2", code: "CNC-02", name: "Torno CNC", status: "OPERATING", active: true },
    operatorId: "user-1",
    operator: { id: "user-1", name: "Carlos Mendoza (Admin)", email: "admin@stopcontrol.local" },
    technicianId: null,
    technician: null,
    workOrder: memoryWorkOrders[2],
    areaId: "area-1",
    area: { id: "area-1", name: "Producción" },
    processId: "proc-1",
    process: { id: "proc-1", name: "Corte" },
    stopTypeId: "type-1",
    stopType: { id: "type-1", name: "Planeado" },
    causeId: "cause-5",
    cause: { id: "cause-5", name: "Ajuste", isRepairable: false },
    priorityId: "priority-1",
    priority: { id: "priority-1", name: "Baja", colorCode: "#3b82f6", level: 1 },
    startTime: new Date(nowMs - 24 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 24 * 3600 * 1000 + 20 * 60 * 1000).toISOString(),
    duration: 20,
    observations: "Ajuste preventivo por cambio de lote de producción",
    actionTaken: "Ajuste de servomotor y centrado de husillo",
    status: "COMPLETED",
    shift: "Nocturno",
    createdAt: new Date(nowMs - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "stop-hist-4",
    machineId: "mach-4",
    machine: { id: "mach-4", code: "ENS-01", name: "Línea de Ensamble", status: "OPERATING", active: true },
    operatorId: "user-2",
    operator: { id: "user-2", name: "Juan Pérez (Operador)", email: "operador@stopcontrol.local" },
    technicianId: null,
    technician: null,
    workOrder: memoryWorkOrders[3],
    areaId: "area-3",
    area: { id: "area-3", name: "Ensamble" },
    processId: "proc-3",
    process: { id: "proc-3", name: "Ensamble" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-3",
    cause: { id: "cause-3", name: "Falta de material", isRepairable: false },
    priorityId: "priority-2",
    priority: { id: "priority-2", name: "Media", colorCode: "#eab308", level: 2 },
    startTime: new Date(nowMs - 12 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 12 * 3600 * 1000 + 60 * 60 * 1000).toISOString(),
    duration: 60,
    observations: "Espera de remaches estructurales desde almacén",
    actionTaken: "Limpieza de guías y sensores durante tiempo de espera",
    status: "COMPLETED",
    shift: "Matutino",
    createdAt: new Date(nowMs - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "stop-hist-5",
    machineId: "mach-5",
    machine: { id: "mach-5", code: "PINT-01", name: "Cabina de Pintura", status: "OPERATING", active: true },
    operatorId: "user-3",
    operator: { id: "user-3", name: "Roberto Gómez (Supervisor)", email: "supervisor@stopcontrol.local" },
    technicianId: "user-4",
    technician: { id: "user-4", name: "Laura Ramos (Mantenimiento)", email: "mantenimiento@stopcontrol.local" },
    workOrder: memoryWorkOrders[4],
    areaId: "area-4",
    area: { id: "area-4", name: "Pintura" },
    processId: "proc-4",
    process: { id: "proc-4", name: "Pintura" },
    stopTypeId: "type-2",
    stopType: { id: "type-2", name: "No planeado" },
    causeId: "cause-7",
    cause: { id: "cause-7", name: "Calidad", isRepairable: false },
    priorityId: "priority-4",
    priority: { id: "priority-4", name: "Crítica", colorCode: "#ef4444", level: 4 },
    startTime: new Date(nowMs - 6 * 3600 * 1000).toISOString(),
    endTime: new Date(nowMs - 6 * 3600 * 1000 + 90 * 60 * 1000).toISOString(),
    duration: 90,
    observations: "Desviación en espesor de película de pintura (piel de naranja)",
    actionTaken: "Sustitución de sello y o-ring en circuito de presión y regulación de flujo",
    status: "COMPLETED",
    shift: "Vespertino",
    createdAt: new Date(nowMs - 6 * 3600 * 1000).toISOString(),
  },
];

/**
 * Consulta de paros activos en el sistema
 */
export async function getActiveStops(operatorId?: string, isOperatorOnly: boolean = false) {
  try {
    const whereClause: { status: string; operatorId?: string } = { status: "ACTIVE" };
    if (isOperatorOnly && operatorId) {
      whereClause.operatorId = operatorId;
    }

    const stops = await db.stop.findMany({
      where: whereClause,
      include: {
        machine: { include: { area: true } },
        area: true,
        process: true,
        stopType: true,
        cause: true,
        priority: true,
        operator: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        workOrder: true,
      },
      orderBy: { startTime: "desc" },
    });

    return stops;
  } catch {
    // Retornar almacén en memoria
    let stops = memoryStops.filter((s) => s.status === "ACTIVE");
    if (isOperatorOnly && operatorId) {
      stops = stops.filter((s) => s.operatorId === operatorId);
    }
    return stops;
  }
}

/**
 * Registro y apertura de un nuevo paro de máquina (FASE 5)
 */
export async function createStop(input: CreateStopInput, session: SessionUser) {
  // 1. Validar autenticación y RBAC
  if (!session) {
    throw new Error("Usuario no autenticado");
  }

  if (session.role !== "ADMINISTRADOR" && session.role !== "OPERADOR") {
    throw new Error("Acceso denegado: solo Operadores y Administradores pueden registrar paros");
  }

  // 2. Validar campos obligatorios
  const { machineId, areaId, processId, stopTypeId, causeId, priorityId, shift, observations } = input;

  if (!machineId) throw new Error("La máquina es obligatoria");
  if (!areaId) throw new Error("El área es obligatoria");
  if (!processId) throw new Error("El proceso es obligatorio");
  if (!stopTypeId) throw new Error("El tipo de paro es obligatorio");
  if (!causeId) throw new Error("La causa de paro es obligatoria");
  if (!priorityId) throw new Error("La prioridad es obligatoria");
  if (!shift) throw new Error("El turno de trabajo es obligatorio");

  const validShifts = ["Matutino", "Vespertino", "Nocturno"];
  if (!validShifts.includes(shift)) {
    throw new Error("El turno especificado no es válido (Matutino, Vespertino, Nocturno)");
  }

  const startTime = new Date(); // Timestamp oficial UTC

  try {
    // 3. Verificar estado de la máquina en base de datos
    const machine = await db.machine.findUnique({
      where: { id: machineId },
      include: {
        stops: { where: { status: "ACTIVE" } },
      },
    });

    if (!machine) {
      throw new Error("La máquina seleccionada no existe en el sistema");
    }

    if (!machine.active) {
      throw new Error(`La máquina ${machine.code} se encuentra inactiva. No se pueden registrar paros.`);
    }

    if (machine.stops.length > 0) {
      throw new Error(`La máquina ${machine.code} ya tiene un paro activo en curso.`);
    }

    // 4. Crear el registro del Paro en estado ACTIVE
    const newStop = await db.stop.create({
      data: {
        machineId,
        operatorId: session.id.startsWith("demo-") ? (await getOrCreateDbOperatorId(session)) : session.id,
        areaId,
        processId,
        stopTypeId,
        causeId,
        priorityId,
        shift,
        startTime,
        endTime: null,
        duration: null,
        observations: observations?.trim() || null,
        status: "ACTIVE",
      },
      include: {
        machine: true,
        area: true,
        process: true,
        stopType: true,
        cause: true,
        priority: true,
        operator: { select: { id: true, name: true, email: true } },
      },
    });

    // 5. Cambiar el estado de la máquina a STOPPED
    await db.machine.update({
      where: { id: machineId },
      data: { status: "STOPPED" },
    });

    syncStopCreated(newStop).catch((e) => console.warn("[GoogleSheets] Error:", e));

    return newStop;
  } catch (dbErr: unknown) {
    const error = dbErr as Error;
    // Si el error fue una validación de negocio, relanzarlo
    if (
      error.message &&
      (error.message.includes("inactiva") ||
        error.message.includes("ya tiene un paro activo") ||
        error.message.includes("no existe"))
    ) {
      throw error;
    }

    // Fallback de demostración en memoria cuando la DB local no está iniciada
    const allCatalogs = await getAllCatalogs();
    const targetMachine = allCatalogs.machines.find((m) => m.id === machineId);

    if (!targetMachine) {
      throw new Error("La máquina seleccionada no existe en el sistema");
    }

    if (targetMachine.active === false) {
      throw new Error(`La máquina ${targetMachine.code || ""} se encuentra inactiva. No se pueden registrar paros.`);
    }

    const existingActive = memoryStops.find(
      (s) => s.machineId === machineId && s.status === "ACTIVE"
    );
    if (existingActive) {
      throw new Error(`La máquina ${targetMachine.code || ""} ya tiene un paro activo en curso.`);
    }

    const newMemoryStop = {
      id: `stop-${Date.now()}`,
      machineId,
      machine: {
        id: targetMachine.id,
        code: targetMachine.code,
        name: targetMachine.name,
        status: "STOPPED",
        active: targetMachine.active,
      },
      operatorId: session.id,
      areaId,
      processId,
      stopTypeId,
      causeId,
      priorityId,
      shift,
      startTime: startTime.toISOString(),
      endTime: null,
      duration: null,
      observations: observations?.trim() || null,
      actionTaken: null,
      status: "ACTIVE",
      createdAt: startTime.toISOString(),
      operator: { id: session.id, name: session.name, email: session.email },
    };

    memoryStops.unshift(newMemoryStop);
    const machIdx = memoryStore.machines.findIndex((m) => m.id === machineId);
    if (machIdx !== -1) {
      memoryStore.machines[machIdx].status = "STOPPED";
    }
    syncStopCreated(newMemoryStop).catch((e) => console.warn("[GoogleSheets] Error:", e));
    return newMemoryStop;
  }
}

// Asignador auxiliar de ID para operador demo en caso de base de datos
async function getOrCreateDbOperatorId(session: SessionUser): Promise<string> {
  const user = await db.user.findUnique({ where: { email: session.email } });
  if (user) return user.id;
  const firstUser = await db.user.findFirst();
  return firstUser ? firstUser.id : session.id;
}

/**
 * Genera el siguiente consecutivo de orden de trabajo en formato OT-YYYY-####
 */
export async function getNextWorkOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const count = await db.workOrder.count({
      where: {
        code: { startsWith: `OT-${year}-` },
      },
    });
    return `OT-${year}-${String(count + 1).padStart(4, "0")}`;
  } catch {
    const prefix = `OT-${year}-`;
    const count = memoryWorkOrders.filter((wo) => wo.code.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }
}

/**
 * Consulta de un paro por su ID
 */
export async function getStopById(stopId: string) {
  try {
    return await db.stop.findUnique({
      where: { id: stopId },
      include: {
        machine: { include: { area: true } },
        area: true,
        process: true,
        stopType: true,
        cause: true,
        priority: true,
        operator: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        workOrder: true,
      },
    });
  } catch {
    return memoryStops.find((s) => s.id === stopId) || null;
  }
}

/**
 * Consulta de paros completados / cerrados
 */
export async function getCompletedStops(limit = 20) {
  try {
    return await db.stop.findMany({
      where: { status: "COMPLETED" },
      include: {
        machine: { include: { area: true } },
        area: true,
        process: true,
        stopType: true,
        cause: true,
        priority: true,
        operator: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        workOrder: true,
      },
      orderBy: { endTime: "desc" },
      take: limit,
    });
  } catch {
    return memoryStops
      .filter((s) => s.status === "COMPLETED")
      .sort((a, b) => new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime())
      .slice(0, limit);
  }
}

/**
 * Cierre de un paro de máquina activo (FASE 6)
 * Ciclo: ACTIVE -> COMPLETED
 * - Genera timestamp oficial de fin en servidor UTC
 * - Calcula duración en minutos a partir de (endTime - startTime)
 * - Registra la acción correctiva tomada (actionTaken)
 * - Vincula técnico de mantenimiento si aplica
 * - Genera Orden de Trabajo (WorkOrder OT-YYYY-####) si la causa es reparable/mantenimiento
 * - Actualiza la máquina de STOPPED a OPERATING
 */
export async function closeStop(
  stopId: string,
  input: CloseStopInput,
  session: SessionUser
) {
  // 1. Validar autenticación
  if (!session) {
    throw new Error("Usuario no autenticado");
  }

  // 2. Validar que el usuario esté activo
  if (session.status !== "ACTIVE") {
    throw new Error("Usuario inactivo o suspendido. No tiene permisos para cerrar paros.");
  }

  // 3. Validar permisos por rol
  const allowedRoles = ["ADMINISTRADOR", "OPERADOR", "SUPERVISOR", "MANTENIMIENTO"];
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Acceso denegado: El rol ${session.role} no tiene permisos para cerrar paros.`);
  }

  // 4. Validar parámetros requeridos
  if (!stopId || !stopId.trim()) {
    throw new Error("El identificador del paro es obligatorio");
  }

  if (!input.actionTaken || !input.actionTaken.trim()) {
    throw new Error("La acción tomada es obligatoria para cerrar el paro");
  }

  // 5. La fecha y hora de fin SIEMPRE se genera en el servidor en UTC (evita manipulación)
  const endTime = new Date();

  try {
    // 6. Buscar el paro en la base de datos
    const stop = await db.stop.findUnique({
      where: { id: stopId },
      include: {
        machine: true,
        cause: true,
        workOrder: true,
      },
    });

    if (!stop) {
      throw new Error("El paro especificado no existe");
    }

    if (stop.status === "COMPLETED") {
      throw new Error("El paro ya ha sido cerrado previamente");
    }

    if (stop.status !== "ACTIVE") {
      throw new Error(`El paro no se encuentra activo (estado actual: ${stop.status})`);
    }

    // 7. Validar consistencia temporal: endTime >= startTime
    if (endTime.getTime() < stop.startTime.getTime()) {
      throw new Error("La hora de finalización no puede ser anterior a la hora de inicio");
    }

    // 8. Calcular duración en minutos exactos (mínimo 1 minuto en piso de planta)
    const diffMs = endTime.getTime() - stop.startTime.getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    // 9. Comprobar si requiere orden de trabajo (Mantenimiento)
    const isMaintenanceCause =
      stop.cause.isRepairable ||
      stop.cause.name.toLowerCase().includes("mecánica") ||
      stop.cause.name.toLowerCase().includes("eléctrica") ||
      stop.cause.name.toLowerCase().includes("mantenimiento") ||
      Boolean(input.technicianId);

    let assignedWorkOrder = stop.workOrder;
    if (isMaintenanceCause && !assignedWorkOrder) {
      const otCode = await getNextWorkOrderCode();
      assignedWorkOrder = await db.workOrder.create({
        data: {
          code: otCode,
          status: "COMPLETED",
          notes: `Acción correctiva: ${input.actionTaken.trim()}`,
          stopId: stop.id,
        },
      });
    }

    // 10. Actualizar el paro a COMPLETED
    const updatedStop = await db.stop.update({
      where: { id: stopId },
      data: {
        status: "COMPLETED",
        endTime,
        duration: durationMinutes,
        actionTaken: input.actionTaken.trim(),
        technicianId: input.technicianId || null,
      },
      include: {
        machine: { include: { area: true } },
        area: true,
        process: true,
        stopType: true,
        cause: true,
        priority: true,
        operator: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        workOrder: true,
      },
    });

    // 11. Cambiar estado de la máquina a OPERATING (si no tiene otros paros activos)
    const otherActiveStops = await db.stop.count({
      where: {
        machineId: stop.machineId,
        status: "ACTIVE",
        id: { not: stopId },
      },
    });

    if (otherActiveStops === 0) {
      await db.machine.update({
        where: { id: stop.machineId },
        data: { status: "OPERATING" },
      });
    }

    syncStopCompleted(updatedStop).catch((e) => console.warn("[GoogleSheets] Error:", e));
    if (assignedWorkOrder) {
      syncWorkOrder({
        id: assignedWorkOrder.id,
        code: assignedWorkOrder.code,
        stopId: updatedStop.id,
        machineCode: updatedStop.machine?.code,
        status: assignedWorkOrder.status,
        notes: assignedWorkOrder.notes,
        technicianName: updatedStop.technician?.name,
      }).catch((e) => console.warn("[GoogleSheets] Error:", e));
    }

    return updatedStop;
  } catch (dbErr: unknown) {
    const error = dbErr as Error;
    // Si el error fue una validación de negocio, relanzarlo inmediatamente
    if (
      error.message &&
      (error.message.includes("no existe") ||
        error.message.includes("ya ha sido cerrado") ||
        error.message.includes("no se encuentra activo") ||
        error.message.includes("anterior a la hora de inicio"))
    ) {
      throw error;
    }

    // Fallback de demostración en memoria cuando la DB PostgreSQL local no esté conectada
    const stopIndex = memoryStops.findIndex((s) => s.id === stopId);
    if (stopIndex === -1) {
      throw new Error("El paro especificado no existe");
    }

    const stop = memoryStops[stopIndex];
    if (stop.status === "COMPLETED") {
      throw new Error("El paro ya ha sido cerrado previamente");
    }
    if (stop.status !== "ACTIVE") {
      throw new Error(`El paro no se encuentra activo (estado actual: ${stop.status})`);
    }

    const startMs = new Date(stop.startTime).getTime();
    if (endTime.getTime() < startMs) {
      throw new Error("La hora de finalización no puede ser anterior a la hora de inicio");
    }

    const diffMs = endTime.getTime() - startMs;
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    // Determinar si la causa requiere WorkOrder
    const isMaintenanceCause =
      stop.cause?.isRepairable !== false ||
      (stop.cause?.name && stop.cause.name.toLowerCase().includes("mecánica")) ||
      (stop.cause?.name && stop.cause.name.toLowerCase().includes("eléctrica")) ||
      (stop.cause?.name && stop.cause.name.toLowerCase().includes("mantenimiento")) ||
      Boolean(input.technicianId);

    let assignedWorkOrder: MemoryWorkOrder | null = stop.workOrder || null;
    if (isMaintenanceCause && !assignedWorkOrder) {
      const otCode = await getNextWorkOrderCode();
      const wo: MemoryWorkOrder = {
        id: `wo-${Date.now()}`,
        code: otCode,
        status: "COMPLETED",
        notes: `Acción correctiva: ${input.actionTaken.trim()}`,
        stopId: stop.id,
        createdAt: endTime.toISOString(),
        updatedAt: endTime.toISOString(),
      };
      memoryWorkOrders.push(wo);
      assignedWorkOrder = wo;
    }

    // Actualizar máquina asociada a OPERATING
    const allCatalogs = await getAllCatalogs();
    const targetMachine = allCatalogs.machines.find((m) => m.id === stop.machineId);
    if (targetMachine) {
      targetMachine.status = "OPERATING";
    }
    const machIndex = memoryStore.machines.findIndex((m) => m.id === stop.machineId);
    if (machIndex !== -1) {
      memoryStore.machines[machIndex].status = "OPERATING";
    }

    // Asociar datos de técnico si fue seleccionado
    let techObj = null;
    if (input.technicianId) {
      const techUser = allCatalogs.users.find((u) => u.id === input.technicianId);
      if (techUser) {
        techObj = { id: techUser.id, name: techUser.name, email: techUser.email };
      }
    }

    const updatedMemoryStop: MemoryStop = {
      ...stop,
      status: "COMPLETED",
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      actionTaken: input.actionTaken.trim(),
      technicianId: input.technicianId || null,
      technician: techObj,
      workOrder: assignedWorkOrder,
    };

    if (updatedMemoryStop.machine) {
      updatedMemoryStop.machine.status = "OPERATING";
    }

    memoryStops[stopIndex] = updatedMemoryStop;
    syncStopCompleted(updatedMemoryStop).catch((e) => console.warn("[GoogleSheets] Error:", e));
    if (assignedWorkOrder) {
      syncWorkOrder({
        id: assignedWorkOrder.id,
        code: assignedWorkOrder.code,
        stopId: updatedMemoryStop.id,
        machineCode: updatedMemoryStop.machine?.code,
        status: assignedWorkOrder.status,
        notes: assignedWorkOrder.notes,
        technicianName: updatedMemoryStop.technician?.name,
      }).catch((e) => console.warn("[GoogleSheets] Error:", e));
    }
    return updatedMemoryStop;
  }
}

/**
 * Consulta de historial paginado con filtros avanzados y control RBAC (FASE 7)
 */
export async function getStopsHistory(
  filters: HistoryQueryFilters,
  session: SessionUser
): Promise<HistoryQueryResult> {
  // 1. Validar autenticación
  if (!session) {
    throw new Error("Usuario no autenticado");
  }

  if (session.status !== "ACTIVE") {
    throw new Error("Usuario inactivo o suspendido");
  }

  // 2. Construir paginación
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 10));
  const skip = (page - 1) * pageSize;

  try {
    // 3. Construir filtros Prisma
    const where: Record<string, unknown> = {};

    // Estado: por defecto prioriza COMPLETED si no se especifica
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    } else if (!filters.status) {
      where.status = "COMPLETED";
    }

    // Catálogos
    if (filters.machineId) where.machineId = filters.machineId;
    if (filters.areaId) where.areaId = filters.areaId;
    if (filters.processId) where.processId = filters.processId;
    if (filters.stopTypeId) where.stopTypeId = filters.stopTypeId;
    if (filters.causeId) where.causeId = filters.causeId;
    if (filters.priorityId) where.priorityId = filters.priorityId;
    if (filters.shift) where.shift = filters.shift;

    // Rango de fechas (startTime)
    if (filters.dateFrom || filters.dateTo) {
      const startTimeFilter: { gte?: Date; lte?: Date } = {};
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (!isNaN(from.getTime())) {
          startTimeFilter.gte = from;
        }
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        if (!isNaN(to.getTime())) {
          if (filters.dateTo.length === 10) {
            to.setHours(23, 59, 59, 999);
          }
          startTimeFilter.lte = to;
        }
      }
      where.startTime = startTimeFilter;
    }

    // Búsqueda textual
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { machine: { code: { contains: q, mode: "insensitive" } } },
        { machine: { name: { contains: q, mode: "insensitive" } } },
        { operator: { name: { contains: q, mode: "insensitive" } } },
        { cause: { name: { contains: q, mode: "insensitive" } } },
        { workOrder: { code: { contains: q, mode: "insensitive" } } },
      ];
    }

    // RBAC a nivel de servidor
    if (session.role === "OPERADOR") {
      // El operador solo puede consultar sus propios registros
      where.operatorId = session.id;
    } else if (session.role === "MANTENIMIENTO") {
      // Mantenimiento consulta paros técnicos/reparables o donde intervino
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { cause: { isRepairable: true } },
            { cause: { name: { contains: "mecánica", mode: "insensitive" } } },
            { cause: { name: { contains: "eléctrica", mode: "insensitive" } } },
            { cause: { name: { contains: "mantenimiento", mode: "insensitive" } } },
            { technicianId: session.id },
            { workOrder: { isNot: null } },
          ],
        },
      ];
    } else if (session.role !== "ADMINISTRADOR" && session.role !== "SUPERVISOR") {
      throw new Error(`Acceso denegado: El rol ${session.role} no tiene permisos para consultar historial.`);
    }

    // Ordenamiento
    let orderBy: Record<string, unknown> = { startTime: "desc" };
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

    if (filters.sortBy === "duration") {
      orderBy = { duration: sortOrder };
    } else if (filters.sortBy === "machine") {
      orderBy = { machine: { code: sortOrder } };
    } else if (filters.sortBy === "startTime") {
      orderBy = { startTime: sortOrder };
    }

    // Ejecución optimizada en base de datos
    const [total, stops] = await Promise.all([
      db.stop.count({ where }),
      db.stop.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          machine: { include: { area: true } },
          area: true,
          process: true,
          stopType: true,
          cause: true,
          priority: true,
          operator: { select: { id: true, name: true, email: true } },
          technician: { select: { id: true, name: true, email: true } },
          workOrder: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;
    return { stops, total, page, pageSize, totalPages };
  } catch (dbErr: unknown) {
    const error = dbErr as Error;
    if (error.message && (error.message.includes("Acceso denegado") || error.message.includes("inactivo"))) {
      throw error;
    }

    // Fallback en memoria si PostgreSQL local no está activo
    let filtered = [...memoryStops];

    // RBAC
    if (session.role === "OPERADOR") {
      filtered = filtered.filter((s) => s.operatorId === session.id);
    } else if (session.role === "MANTENIMIENTO") {
      filtered = filtered.filter(
        (s) =>
          s.cause?.isRepairable !== false ||
          s.technicianId === session.id ||
          Boolean(s.workOrder) ||
          (s.cause?.name && (s.cause.name.toLowerCase().includes("mecánica") || s.cause.name.toLowerCase().includes("eléctrica")))
      );
    } else if (session.role !== "ADMINISTRADOR" && session.role !== "SUPERVISOR") {
      throw new Error(`Acceso denegado: El rol ${session.role} no tiene permisos para consultar historial.`);
    }

    // Filtro de Estado
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((s) => s.status === filters.status);
    } else if (!filters.status) {
      filtered = filtered.filter((s) => s.status === "COMPLETED");
    }

    // Filtros de Catálogos
    if (filters.machineId) filtered = filtered.filter((s) => s.machineId === filters.machineId);
    if (filters.areaId) filtered = filtered.filter((s) => s.areaId === filters.areaId);
    if (filters.processId) filtered = filtered.filter((s) => s.processId === filters.processId);
    if (filters.stopTypeId) filtered = filtered.filter((s) => s.stopTypeId === filters.stopTypeId);
    if (filters.causeId) filtered = filtered.filter((s) => s.causeId === filters.causeId);
    if (filters.priorityId) filtered = filtered.filter((s) => s.priorityId === filters.priorityId);
    if (filters.shift) filtered = filtered.filter((s) => s.shift === filters.shift);

    // Rango de fechas
    if (filters.dateFrom) {
      const fromMs = new Date(filters.dateFrom).getTime();
      if (!isNaN(fromMs)) {
        filtered = filtered.filter((s) => new Date(s.startTime).getTime() >= fromMs);
      }
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (filters.dateTo.length === 10) to.setHours(23, 59, 59, 999);
      const toMs = to.getTime();
      if (!isNaN(toMs)) {
        filtered = filtered.filter((s) => new Date(s.startTime).getTime() <= toMs);
      }
    }

    // Búsqueda
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const machCode = s.machine?.code?.toLowerCase() || "";
        const machName = s.machine?.name?.toLowerCase() || "";
        const opName = s.operator?.name?.toLowerCase() || "";
        const causeName = s.cause?.name?.toLowerCase() || "";
        const woCode = s.workOrder?.code?.toLowerCase() || "";
        return (
          machCode.includes(q) ||
          machName.includes(q) ||
          opName.includes(q) ||
          causeName.includes(q) ||
          woCode.includes(q)
        );
      });
    }

    // Ordenamiento
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
    if (filters.sortBy === "duration") {
      filtered.sort((a, b) => ((a.duration || 0) - (b.duration || 0)) * sortOrder);
    } else if (filters.sortBy === "machine") {
      filtered.sort((a, b) => (a.machine?.code || "").localeCompare(b.machine?.code || "") * sortOrder);
    } else {
      // Por defecto por startTime descendente
      filtered.sort((a, b) => (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) * sortOrder);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      stops: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}

/**
 * Consulta de detalle completo de un paro para trazabilidad y auditoría
 */
export async function getStopDetailById(stopId: string, session: SessionUser) {
  if (!session) throw new Error("Usuario no autenticado");
  if (session.status !== "ACTIVE") throw new Error("Usuario inactivo");

  const stop = await getStopById(stopId);
  if (!stop) throw new Error("El evento de paro no fue encontrado.");

  // Validación de permisos para ver el detalle
  if (session.role === "OPERADOR" && stop.operatorId !== session.id) {
    throw new Error("Acceso denegado: El operador no tiene permisos para consultar este registro.");
  }

  if (session.role === "MANTENIMIENTO") {
    const isMaint =
      stop.cause?.isRepairable !== false ||
      stop.technicianId === session.id ||
      Boolean(stop.workOrder) ||
      (stop.cause?.name && (stop.cause.name.toLowerCase().includes("mecánica") || stop.cause.name.toLowerCase().includes("eléctrica")));
    if (!isMaint) {
      throw new Error("Acceso denegado: Registro fuera del alcance de mantenimiento.");
    }
  }

  return stop;
}

/**
 * Exportación de resultados filtrados del historial a formato CSV (FASE 7)
 */
export async function exportHistoryToCSV(
  filters: HistoryQueryFilters,
  session: SessionUser
): Promise<string> {
  // Se consultan todos los registros que cumplen los filtros sin paginación (hasta 10,000 registros)
  const result = await getStopsHistory({ ...filters, page: 1, pageSize: 10000 }, session);
  const rows = result.stops;

  const headers = [
    "ID Paro",
    "Fecha",
    "Hora Inicio (UTC)",
    "Hora Fin (UTC)",
    "Duracion (min)",
    "Estado",
    "Codigo Maquina",
    "Nombre Maquina",
    "Area",
    "Proceso",
    "Tipo de Paro",
    "Causa Raiz",
    "Prioridad",
    "Turno",
    "Operador",
    "Tecnico Mantenimiento",
    "Orden de Trabajo (OT)",
    "Accion Tomada",
    "Observaciones Iniciales",
  ];

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [headers.join(",")];

  for (const r of rows) {
    const line = [
      escapeCsv(r.id),
      escapeCsv(r.startTime ? new Date(r.startTime).toISOString().slice(0, 10) : ""),
      escapeCsv(r.startTime ? new Date(r.startTime).toISOString() : ""),
      escapeCsv(r.endTime ? new Date(r.endTime).toISOString() : ""),
      escapeCsv(r.duration !== null && r.duration !== undefined ? r.duration : ""),
      escapeCsv(r.status),
      escapeCsv(r.machine?.code || ""),
      escapeCsv(r.machine?.name || ""),
      escapeCsv(r.area?.name || ""),
      escapeCsv(r.process?.name || ""),
      escapeCsv(r.stopType?.name || ""),
      escapeCsv(r.cause?.name || ""),
      escapeCsv(r.priority?.name || ""),
      escapeCsv(r.shift || ""),
      escapeCsv(r.operator?.name || ""),
      escapeCsv(r.technician?.name || ""),
      escapeCsv(r.workOrder?.code || ""),
      escapeCsv(r.actionTaken || ""),
      escapeCsv(r.observations || ""),
    ];
    csvLines.push(line.join(","));
  }

  // Prepend UTF-8 BOM (\uFEFF) para compatibilidad con Excel y acentos en español
  return "\uFEFF" + csvLines.join("\r\n");
}

export { memoryStops, memoryWorkOrders };

