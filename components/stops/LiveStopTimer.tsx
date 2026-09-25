"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface LiveStopTimerProps {
  startTime: string; // ISO string en UTC
  className?: string;
  showIcon?: boolean;
}

/**
 * Componente de Cronómetro en Vivo para Paros Activos
 * 
 * Reglas de implementación:
 * - La fuente de verdad es `startTime` (persisitido en base de datos en UTC).
 * - No depende de un acumulador local del navegador.
 * - Si el usuario recarga la página, el cronómetro recalcula instantáneamente
 *   el tiempo transcurrido exacto contra Date.now().
 * - Formato: HH:MM:SS mediante formatDuration.
 */
export default function LiveStopTimer({
  startTime,
  className = "",
  showIcon = true,
}: LiveStopTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return 0;
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  useEffect(() => {
    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return;

    // Actualización inmediata
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));

    // Intervalo de 1 segundo
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Si el paro supera 1 hora (3600s), destacar en ámbar/rojo
  const isHighDuration = elapsedSeconds >= 3600;
  const isCriticalDuration = elapsedSeconds >= 7200; // > 2 horas

  const colorClass = isCriticalDuration
    ? "text-red-400 bg-red-950/40 border-red-800/60"
    : isHighDuration
    ? "text-amber-400 bg-amber-950/40 border-amber-800/60"
    : "text-emerald-400 bg-emerald-950/40 border-emerald-800/60";

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border font-mono font-bold tracking-wider text-xs shadow-sm transition-colors ${colorClass} ${className}`}
      title={`Inicio registrado: ${new Date(startTime).toISOString()}`}
    >
      {showIcon && <Timer className="w-3.5 h-3.5 animate-pulse" />}
      <span className="tabular-nums">{formatDuration(elapsedSeconds)}</span>
    </div>
  );
}
