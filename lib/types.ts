/**
 * STOPControl 2.0 — Definiciones de tipos y dominio del sistema
 */

export type RoleName = 'ADMINISTRADOR' | 'OPERADOR' | 'SUPERVISOR' | 'MANTENIMIENTO' | 'CALIDAD';

export type MachineStatus = 'OPERATING' | 'STOPPED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export type StopStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type ShiftType = 'TURNO_1' | 'TURNO_2' | 'TURNO_3';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Area {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Process {
  id: string;
  name: string;
  createdAt?: string;
}

export interface StopType {
  id: string;
  name: string; // Planeado | No planeado
  createdAt?: string;
}

export interface StopCause {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Priority {
  id: string;
  name: string; // Baja | Media | Alta | Crítica
  colorCode?: string;
  level: number;
}

export interface Machine {
  id: string;
  code: string; // CNC-01, CNC-02, etc.
  name: string;
  areaId: string;
  area?: Area;
  status: MachineStatus;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrder {
  id: string;
  code: string; // OT-2026-0001
  status: WorkOrderStatus;
  notes?: string;
  stopId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stop {
  id: string;
  machineId: string;
  machine?: Machine;
  operatorId: string;
  operator?: User;
  processId: string;
  process?: Process;
  areaId: string;
  area?: Area;
  stopTypeId: string;
  stopType?: StopType;
  causeId: string;
  cause?: StopCause;
  priorityId: string;
  priority?: Priority;
  technicianId?: string | null;
  technician?: User | null;
  workOrderId?: string | null;
  workOrder?: WorkOrder | null;
  startTime: string;
  endTime?: string | null;
  duration?: number | null; // segundos
  observations?: string | null;
  actionTaken?: string | null;
  status: StopStatus;
  shift?: ShiftType;
  createdAt?: string;
  updatedAt?: string;
}

export interface StopFilter {
  startDate?: string;
  endDate?: string;
  machineId?: string;
  areaId?: string;
  processId?: string;
  stopTypeId?: string;
  causeId?: string;
  shift?: ShiftType;
  status?: StopStatus;
}

export interface DashboardKPIs {
  totalStops: number;
  totalDurationSeconds: number;
  mttrHours: number;
  mtbfHours: number;
  availabilityPercent: number;
  activeStopsCount: number;
  stoppedMachinesCount: number;
}

export interface ParetoItem {
  id: string;
  name: string;
  count: number;
  totalDurationSeconds: number;
  percentage: number;
  cumulativePercentage: number;
}
