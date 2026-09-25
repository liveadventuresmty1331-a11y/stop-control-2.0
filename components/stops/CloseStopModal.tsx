"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  UserCheck, 
  FileText,
  Clock
} from "lucide-react";
import LiveStopTimer from "./LiveStopTimer";
import { formatDateTime } from "@/lib/utils";

interface StopSummary {
  id: string;
  machineId: string;
  machine?: { code?: string; name?: string; status?: string };
  causeId: string;
  cause?: { name?: string; isRepairable?: boolean };
  priority?: { name?: string; colorCode?: string };
  startTime: string;
  observations?: string | null;
}

interface TechnicianOption {
  id: string;
  name: string;
  email: string;
}

import type { StopRecord } from "./ActiveStopsView";

interface CatalogUserItem {
  id: string;
  name: string;
  email: string;
  status?: string;
  role?: string | { name?: string };
}

interface CloseStopModalProps {
  stop: StopSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (closedStop: StopRecord) => void;
}

export default function CloseStopModal({
  stop,
  isOpen,
  onClose,
  onSuccess,
}: CloseStopModalProps) {
  const [actionTaken, setActionTaken] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de técnicos de mantenimiento desde catálogos
  useEffect(() => {
    async function loadTechnicians() {
      try {
        const res = await fetch("/api/catalogs");
        if (res.ok) {
          const data = await res.json();
          const techUsers = (data.users || []).filter(
            (u: CatalogUserItem) => 
              u.status === "ACTIVE" && 
              ((typeof u.role === "object" ? u.role?.name : u.role) === "MANTENIMIENTO" || 
               (typeof u.role === "object" ? u.role?.name : u.role) === "ADMINISTRADOR")
          );
          setTechnicians(techUsers);
        }
      } catch {
        // Fallback si falla la consulta
      }
    }
    if (isOpen) {
      loadTechnicians();
      setActionTaken("");
      setTechnicianId("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRepairable = stop.cause?.isRepairable !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!actionTaken.trim()) {
      setError("Debe detallar la acción correctiva o trabajo realizado.");
      return;
    }

    if (actionTaken.trim().length < 5) {
      setError("La descripción de la acción tomada debe tener al menos 5 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/stops/${stop.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionTaken: actionTaken.trim(),
          technicianId: technicianId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo cerrar el paro.");
      }

      onSuccess(data.stop);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Error al comunicarse con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cerrar y Finalizar Paro</h2>
              <p className="text-xs text-slate-400">
                Máquina: <strong className="text-slate-200">{stop.machine?.code} - {stop.machine?.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Paro en Curso */}
        <div className="px-6 py-3.5 bg-slate-950/30 border-b border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Causa Raíz</span>
            <span className="font-semibold text-slate-200">{stop.cause?.name || "No especificada"}</span>
            {isRepairable && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-sky-950/60 border border-sky-800/50 text-sky-400">
                Generará Orden OT
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Cronómetro en Vivo</span>
            <div className="mt-0.5">
              <LiveStopTimer startTime={stop.startTime} />
            </div>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Hora de inicio: {formatDateTime(stop.startTime)}
            </span>
          </div>
        </div>

        {/* Formulario de Cierre */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campo: Acción tomada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Acción Correctiva / Solución Aplicada *
              </span>
            </label>
            <textarea
              required
              rows={3}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describa el trabajo realizado, refacciones cambiadas o procedimiento ejecutado para reactivar el equipo..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Campo obligatorio. Esta información formará parte del historial técnico y la orden de trabajo.
            </p>
          </div>

          {/* Campo: Técnico de Mantenimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                Técnico de Mantenimiento Interviniente {isRepairable ? "(Recomendado)" : "(Opcional)"}
              </span>
            </label>
            <div className="relative">
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full appearance-none rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
              >
                <option value="">-- Sin técnico asignado / Atendido por operador --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Asigne el técnico responsable para el cálculo de indicadores de servicio MTTR.
            </p>
          </div>

          {/* Aviso de Transición de Estado */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300/90 flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Actualización automática al confirmar:</p>
              <ul className="list-disc list-inside mt-0.5 text-[10.5px] text-slate-400 space-y-0.5">
                <li>El paro cambiará de estado: <strong className="text-emerald-400">ACTIVE → COMPLETED</strong></li>
                <li>La máquina <strong className="text-white">{stop.machine?.code}</strong> cambiará: <strong className="text-emerald-400">STOPPED → OPERATING</strong></li>
                <li>El servidor calculará la duración oficial exacta en minutos (UTC)</li>
              </ul>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Finalizando Paro...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Finalizar Paro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
