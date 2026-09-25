"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, 
  Server, 
  Layers, 
  Cog, 
  Timer, 
  Flame, 
  Clock, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { SessionUser } from "@/lib/auth";

interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  areaId?: string;
  status?: string;
  active?: boolean;
  colorCode?: string | null;
  level?: number;
}

interface RegisterStopFormProps {
  user: SessionUser;
  machines: CatalogItem[];
  areas: CatalogItem[];
  processes: CatalogItem[];
  stopTypes: CatalogItem[];
  causes: CatalogItem[];
  priorities: CatalogItem[];
}

export default function RegisterStopForm({
  user,
  machines,
  areas,
  processes,
  stopTypes,
  causes,
  priorities,
}: RegisterStopFormProps) {
  const router = useRouter();

  // Filtrar solo máquinas activas
  const activeMachines = machines.filter((m) => m.active !== false);

  const [machineId, setMachineId] = useState(activeMachines[0]?.id || "");
  const [areaId, setAreaId] = useState(() => {
    const firstMach = activeMachines[0];
    return firstMach?.areaId || areas[0]?.id || "";
  });
  const [processId, setProcessId] = useState(processes[0]?.id || "");
  const [stopTypeId, setStopTypeId] = useState(stopTypes[0]?.id || "");
  const [causeId, setCauseId] = useState(causes[0]?.id || "");
  const [priorityId, setPriorityId] = useState(priorities[0]?.id || "");
  const [shift, setShift] = useState("Matutino");
  const [observations, setObservations] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Al seleccionar máquina, auto-vincular su área si existe
  const handleMachineChange = (mId: string) => {
    setMachineId(mId);
    const selectedMach = machines.find((m) => m.id === mId);
    if (selectedMach?.areaId) {
      setAreaId(selectedMach.areaId);
    }
  };

  const selectedMachine = machines.find((m) => m.id === machineId);
  const isAlreadyStopped = selectedMachine?.status === "STOPPED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId,
          areaId,
          processId,
          stopTypeId,
          causeId,
          priorityId,
          shift,
          observations,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Error al iniciar el paro");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/active-stops");
        router.refresh();
      }, 1200);
    } catch {
      setError("Error de comunicación con el servidor al registrar el paro");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      {/* Alerta de Éxito */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">¡Paro registrado e iniciado exitosamente!</p>
            <p className="text-xs text-emerald-400/80">
              La máquina ha cambiado a estado STOPPED (🔴). Redirigiendo a Paros Activos...
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm shadow-xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Cabecera del Formulario */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="font-bold text-base text-white">Registro de Paro de Maquinaria</h2>
            </div>
            <span className="text-xs font-mono bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30">
              Paso 1: Apertura
            </span>
          </div>

          {/* Info del Operador que Registra */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Operador Responsable:</span>
              <strong className="text-white">{user.name}</strong>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-900/40">
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 hidden sm:flex">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Hora de inicio se registrará automáticamente en UTC</span>
            </div>
          </div>
        </div>

        {/* Campos de Selección */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selección de Máquina */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-rose-400" />
                <span>1. Máquina *</span>
              </label>
              <select
                required
                value={machineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {activeMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name} {m.status === "STOPPED" ? "(🔴 En paro)" : "(🟢 Operando)"}
                  </option>
                ))}
              </select>
              {isAlreadyStopped && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Esta máquina ya tiene un paro registrado.
                </span>
              )}
            </div>

            {/* Selección de Área */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>2. Área *</span>
              </label>
              <select
                required
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Proceso */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cog className="w-3.5 h-3.5 text-blue-400" />
                <span>3. Proceso Operativo *</span>
              </label>
              <select
                required
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Tipo de Paro */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Tipo de Paro *</span>
              </label>
              <select
                required
                value={stopTypeId}
                onChange={(e) => setStopTypeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {stopTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Causa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>5. Causa de Paro *</span>
              </label>
              <select
                required
                value={causeId}
                onChange={(e) => setCauseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {causes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Prioridad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>6. Prioridad *</span>
              </label>
              <select
                required
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
              >
                {priorities.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Turno */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>7. Turno de Trabajo *</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Matutino", "Vespertino", "Nocturno"].map((t) => {
                  const isSelected = shift === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setShift(t)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition ${
                        isSelected
                          ? "bg-rose-950/60 border-rose-500 text-white shadow-md shadow-rose-950/40"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observaciones */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Observaciones / Descripción Inicial
              </label>
              <textarea
                rows={3}
                placeholder="Describa el síntoma visual, sonoro o motivo por el que se detiene la máquina..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Botón Principal Industrial */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Al iniciar el paro, el estado de la máquina cambiará a 🔴 STOPPED.</span>
          </div>

          <button
            type="submit"
            disabled={submitting || isAlreadyStopped}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-900/40 transition active:scale-95"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Registrando Paro...
              </span>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                <span>INICIAR PARO</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
