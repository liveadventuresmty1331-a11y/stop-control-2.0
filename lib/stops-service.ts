import { db } from "./db";
import { SessionUser } from "./auth";
import { getAllCatalogs } from "./catalogs-service";

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
    cause: { id: "cause-1", name: "Falla mecánica" },
    priorityId: "priority-3",
    priority: { id: "priority-3", name: "Alta", colorCode: "#f97316" },
    startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    endTime: null,
    duration: null,
    observations: "Ruido anormal y vibración en torreta de herramientas",
    actionTaken: null,
    status: "ACTIVE",
    shift: "Matutino",
    createdAt: new Date().toISOString(),
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
    return updatedMemoryStop;
  }
}
