"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  RefreshCw, 
  Plus, 
  Clock, 
  User as UserIcon, 
  AlertTriangle, 
  Flame, 
  CheckCircle2,
  Filter
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

interface StopRecord {
  id: string;
  machineId: string;
  machine?: { code?: string; name?: string; status?: string };
  areaId: string;
  area?: { name?: string };
  processId: string;
  process?: { name?: string };
  stopTypeId: string;
  stopType?: { name?: string };
  causeId: string;
  cause?: { name?: string };
  priorityId: string;
  priority?: { name?: string; colorCode?: string; level?: number };
  operatorId: string;
  operator?: { name?: string; email?: string };
  shift?: string;
  startTime: string;
  observations?: string | null;
}

interface ActiveStopsViewProps {
  user: SessionUser;
}

export default function ActiveStopsView({ user }: ActiveStopsViewProps) {
  const [stops, setStops] = useState<StopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOwn, setFilterOwn] = useState(false);

  const fetchActiveStops = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterOwn ? "/api/stops/active?own=true" : "/api/stops/active";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStops(data);
      }
    } catch (e) {
      console.error("Error al cargar paros activos:", e);
    } finally {
      setLoading(false);
    }
  }, [filterOwn]);

  useEffect(() => {
    fetchActiveStops();
    // Sondeo periódico cada 15 segundos para monitoreo de planta
    const interval = setInterval(fetchActiveStops, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveStops]);

  const canRegister = user.role === "ADMINISTRADOR" || user.role === "OPERADOR";

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Título y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-xl font-bold text-white tracking-tight">Monitor de Paros Activos en Planta</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo en tiempo real de maquinaria actualmente detenida.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user.role === "OPERADOR" && (
            <button
              onClick={() => setFilterOwn(!filterOwn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterOwn
                  ? "bg-rose-950/60 border-rose-600 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterOwn ? "Viendo solo mis paros" : "Ver solo mis paros"}</span>
            </button>
          )}

          <button
            onClick={fetchActiveStops}
            title="Refrescar lista"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canRegister && (
            <Link
              href="/register-stop"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Paro</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid de Paros Activos */}
      {stops.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Sin paros activos en este momento</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todas las máquinas registradas se encuentran en estado operativo 🟢. Cuando se registre una falla o parada, aparecerá inmediatamente en este panel.
            </p>
          </div>
          {canRegister && (
            <Link
              href="/register-stop"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>Abrir un paro de máquina</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stops.map((stop) => (
            <div
              key={stop.id}
              className="rounded-xl border border-rose-900/40 bg-slate-900/60 p-5 flex flex-col justify-between gap-4 shadow-xl hover:border-rose-700/60 transition group"
            >
              {/* Encabezado del Paro */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400 font-black text-sm">
                    {stop.machine?.code?.slice(0, 3) || "STP"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {stop.machine?.code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium truncate">
                        {stop.machine?.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {stop.area?.name || "Área General"} • {stop.process?.name || "Proceso"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    PARO ACTIVO
                  </span>
                </div>
              </div>

              {/* Detalles Técnicos */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Causa
                  </span>
                  <span className="font-semibold text-slate-200 truncate">{stop.cause?.name || "-"}</span>
                  <span className="text-[10px] text-slate-500">{stop.stopType?.name || "No planeado"}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> Prioridad
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stop.priority?.colorCode || "#ef4444" }}
                    />
                    <span className="font-semibold text-slate-200">{stop.priority?.name || "Normal"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Nivel {stop.priority?.level || 1}</span>
                </div>
              </div>

              {/* Observaciones */}
              {stop.observations && (
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                    Observaciones Iniciales:
                  </span>
                  <p className="italic text-[11px] leading-relaxed text-slate-400">&ldquo;{stop.observations}&rdquo;</p>
                </div>
              )}

              {/* Pie de Tarjeta: Operador, Turno y Hora */}
              <div className="pt-3 border-t border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Operador:</span>
                  <strong className="text-slate-300">{stop.operator?.name || "Operador"}</strong>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{stop.shift || "Matutino"}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400/90">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Inicio: {formatDateTime(stop.startTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
