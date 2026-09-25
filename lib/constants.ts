import { MachineStatus, RoleName } from './types';

export const MACHINE_STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; badgeClass: string; dotClass: string; icon: string }
> = {
  OPERATING: {
    label: 'Operando',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    icon: '🟢',
  },
  STOPPED: {
    label: 'En paro',
    badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse',
    dotClass: 'bg-rose-500',
    icon: '🔴',
  },
  MAINTENANCE: {
    label: 'Mantenimiento',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dotClass: 'bg-amber-500',
    icon: '🟡',
  },
  OUT_OF_SERVICE: {
    label: 'Fuera de servicio',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-400',
    icon: '⚪',
  },
};

export const INITIAL_AREAS = [
  'Producción',
  'Soldadura',
  'Ensamble',
  'Pintura',
];

export const INITIAL_PROCESSES = [
  'Corte',
  'Soldadura',
  'Ensamble',
  'Pintura',
];

export const INITIAL_STOP_TYPES = [
  'Planeado',
  'No planeado',
];

export const INITIAL_CAUSES = [
  'Falla mecánica',
  'Falla eléctrica',
  'Falta de material',
  'Mantenimiento',
  'Ajuste',
  'Error humano',
  'Calidad',
  'Otra',
];

export const INITIAL_PRIORITIES = [
  { name: 'Baja', level: 1, color: '#3b82f6' },
  { name: 'Media', level: 2, color: '#eab308' },
  { name: 'Alta', level: 3, color: '#f97316' },
  { name: 'Crítica', level: 4, color: '#ef4444' },
];

export const INITIAL_MACHINES = [
  { code: 'CNC-01', name: 'Torno CNC', areaName: 'Producción' },
  { code: 'CNC-02', name: 'Torno CNC', areaName: 'Producción' },
  { code: 'SOLD-01', name: 'Soldadora', areaName: 'Soldadura' },
  { code: 'ENS-01', name: 'Línea de Ensamble', areaName: 'Ensamble' },
  { code: 'PINT-01', name: 'Cabina de Pintura', areaName: 'Pintura' },
];

export const DEMO_USERS: Array<{
  role: RoleName;
  name: string;
  email: string;
  description: string;
}> = [
  {
    role: 'ADMINISTRADOR',
    name: 'Carlos Mendoza',
    email: 'admin@stopcontrol.local',
    description: 'Acceso total a catálogos, usuarios, historial e indicadores.',
  },
  {
    role: 'OPERADOR',
    name: 'Juan Pérez',
    email: 'operador@stopcontrol.local',
    description: 'Registro, inicio y finalización de paros en tiempo real.',
  },
  {
    role: 'SUPERVISOR',
    name: 'Roberto Gómez',
    email: 'supervisor@stopcontrol.local',
    description: 'Monitoreo de paros activos, dashboard e historial con filtros.',
  },
  {
    role: 'MANTENIMIENTO',
    name: 'Laura Ramos',
    email: 'mantenimiento@stopcontrol.local',
    description: 'Gestión de órdenes de trabajo, análisis de MTTR, MTBF y disponibilidad.',
  },
];
