import { 
  Activity, 
  ShieldAlert, 
  Clock, 
  BarChart3, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  Server
} from "lucide-react";
import { INITIAL_MACHINES, MACHINE_STATUS_CONFIG, DEMO_USERS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Industrial Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-600 flex items-center justify-center font-black text-xl shadow-lg shadow-rose-900/30 text-white">
              ST
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">STOPControl</span>
                <span className="text-xs bg-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-500/30">2.0</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Control & Monitoreo de Paros Industriales</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Fase 1: Preparación Lista
            </span>
          </div>
        </div>
      </header>

      {/* Hero Industrial Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
        <div className="flex flex-col gap-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 self-center px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Prototipo Académico de Nivel Industrial
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Monitoreo en Tiempo Real y Análisis de Paros de Maquinaria
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Elimina los registros en papel y Excel. Centraliza la trazabilidad de fallas, cronometra la duración exacta, calcula MTTR/MTBF y descubre el 20% de causas críticas con diagramas de Pareto.
          </p>
        </div>

        {/* Demo Machinery Status Board Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-500" />
              <h2 className="font-semibold text-white">Línea de Maquinaria Demo</h2>
            </div>
            <span className="text-xs text-slate-400">5 Estaciones Configuradas (24h/día)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {INITIAL_MACHINES.map((machine, index) => {
              const statusKey = index === 0 ? "STOPPED" : "OPERATING";
              const status = MACHINE_STATUS_CONFIG[statusKey];
              return (
                <div 
                  key={machine.code}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">{machine.code}</span>
                      <h3 className="font-semibold text-sm text-white">{machine.name}</h3>
                      <p className="text-xs text-slate-500">{machine.areaName}</p>
                    </div>
                    <span className="text-base">{status.icon}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estado:</span>
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${status.badgeClass}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture & RBAC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roles Demo Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-white">4 Roles del Sistema (RBAC)</h2>
            </div>
            <div className="space-y-3">
              {DEMO_USERS.map((user) => (
                <div key={user.role} className="flex items-start justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-400">{user.role}</span>
                      <span className="text-xs text-slate-400 font-medium">({user.name})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{user.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                    {user.email.split('@')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Technical Highlights */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-white">Capacidades Técnicas Base</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Cronómetro en Servidor</span>
                <p className="text-[11px] text-slate-400">Resistente a F5 y cierre de pestañas, auditado con start_time.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Diagrama de Pareto</span>
                <p className="text-[11px] text-slate-400">Identificación 80/20 de causas raíz y máquinas críticas.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">MTTR & MTBF</span>
                <p className="text-[11px] text-slate-400">Cálculo riguroso de disponibilidad industrial y confiabilidad.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Órdenes de Trabajo</span>
                <p className="text-[11px] text-slate-400">Generación correlativa OT-2026-#### automática por evento.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <p>STOPControl 2.0 — Prototipo Académico de Control de Paros Industriales • Next.js 14 • React 18 • TypeScript • Tailwind CSS • PostgreSQL</p>
      </footer>
    </div>
  );
}
