"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ShieldCheck, AlertCircle } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import HistoryFilters, { FilterState } from "./HistoryFilters";
import HistoryTable, { HistoryStopRecord } from "./HistoryTable";
import StopDetailModal from "./StopDetailModal";

interface HistoryViewProps {
  user: SessionUser;
}

const initialFilters: FilterState = {
  search: "",
  dateFrom: "",
  dateTo: "",
  machineId: "",
  areaId: "",
  processId: "",
  stopTypeId: "",
  causeId: "",
  priorityId: "",
  shift: "",
  status: "COMPLETED",
  sortBy: "startTime",
  sortOrder: "desc",
};

export default function HistoryView({ user }: HistoryViewProps) {
  const [catalogs, setCatalogs] = useState({
    machines: [],
    areas: [],
    processes: [],
    stopTypes: [],
    stopCauses: [],
    priorities: [],
  });
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [stops, setStops] = useState<HistoryStopRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDetailStop, setSelectedDetailStop] = useState<HistoryStopRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar catálogos maestros
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const res = await fetch("/api/catalogs");
        if (res.ok) {
          const data = await res.json();
          setCatalogs({
            machines: data.machines || [],
            areas: data.areas || [],
            processes: data.processes || [],
            stopTypes: data.stopTypes || [],
            stopCauses: data.stopCauses || [],
            priorities: data.priorities || [],
          });
        }
      } catch (e) {
        console.error("Error al cargar catálogos en historial:", e);
      }
    }
    loadCatalogs();
  }, []);

  // Consultar historial en servidor
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.machineId) params.set("machineId", filters.machineId);
      if (filters.areaId) params.set("areaId", filters.areaId);
      if (filters.processId) params.set("processId", filters.processId);
      if (filters.stopTypeId) params.set("stopTypeId", filters.stopTypeId);
      if (filters.causeId) params.set("causeId", filters.causeId);
      if (filters.priorityId) params.set("priorityId", filters.priorityId);
      if (filters.shift) params.set("shift", filters.shift);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/stops/history?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al consultar historial.");
      }

      const data = await res.json();
      setStops(data.stops || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Error al comunicarse con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Regresar a la página 1 cuando cambia un filtro
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  // Exportar a CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.machineId) params.set("machineId", filters.machineId);
      if (filters.areaId) params.set("areaId", filters.areaId);
      if (filters.processId) params.set("processId", filters.processId);
      if (filters.stopTypeId) params.set("stopTypeId", filters.stopTypeId);
      if (filters.causeId) params.set("causeId", filters.causeId);
      if (filters.priorityId) params.set("priorityId", filters.priorityId);
      if (filters.shift) params.set("shift", filters.shift);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await fetch(`/api/stops/export?${params.toString()}`);
      if (!res.ok) throw new Error("Error al generar archivo CSV");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stopcontrol_historial_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Error al exportar CSV:", e);
      alert("No se pudo descargar el archivo CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Historial y Trazabilidad de Paros</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro auditable de eventos, duraciones oficiales y órdenes de trabajo (Fase 7).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rol: <strong className="text-white">{user.role}</strong></span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Panel de Filtros */}
      <HistoryFilters
        catalogs={catalogs}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onExportCSV={handleExportCSV}
        isExporting={isExporting}
        totalResults={total}
      />

      {/* Tabla con Paginación */}
      <HistoryTable
        stops={stops}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onViewDetail={setSelectedDetailStop}
      />

      {/* Modal de Detalle Completo de Trazabilidad */}
      {selectedDetailStop && (
        <StopDetailModal
          stop={selectedDetailStop}
          isOpen={Boolean(selectedDetailStop)}
          onClose={() => setSelectedDetailStop(null)}
        />
      )}
    </div>
  );
}
