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

export interface MemoryStop {
  id: string;
  machineId: string;
  machine?: { id?: string; code?: string; name?: string; status?: string; active?: boolean };
  operatorId: string;
  operator?: { id?: string; name?: string; email?: string };
  areaId: string;
  area?: { id?: string; name?: string };
  processId: string;
  process?: { id?: string; name?: string };
  stopTypeId: string;
  stopType?: { id?: string; name?: string };
  causeId: string;
  cause?: { id?: string; name?: string };
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
