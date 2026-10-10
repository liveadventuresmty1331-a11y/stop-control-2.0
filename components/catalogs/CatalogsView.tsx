"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Server,
  Users,
  MapPin,
  Cog,
  AlertTriangle,
  Timer,
  Flame,
  Plus,
  Edit2,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import { MACHINE_STATUS_CONFIG } from "@/lib/constants";
import { MachineStatus } from "@/lib/types";

type CatalogTab = "machines" | "users" | "areas" | "processes" | "stop-causes" | "stop-types" | "priorities";

interface BaseItem {
  id: string;
  name?: string;
  description?: string;
  code?: string;
  email?: string;
  status?: string;
  active?: boolean;
  areaId?: string;
  areaName?: string;
  area?: { id: string; name: string };
  role?: string | { id: string; name: string };
  isRepairable?: boolean;
  level?: number;
  colorCode?: string;
}

interface CatalogsData {
  machines: BaseItem[];
  users: BaseItem[];
  areas: BaseItem[];
  processes: BaseItem[];
  stopCauses: BaseItem[];
  stopTypes: BaseItem[];
  priorities: BaseItem[];
  roles: Array<{ id: string; name: string }>;
}

export default function CatalogsView() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("machines");
  const [loading, setLoading] = useState(true);
  const [catalogs, setCatalogs] = useState<CatalogsData>({
    machines: [],
    users: [],
    areas: [],
    processes: [],
    stopCauses: [],
    stopTypes: [],
    priorities: [],
    roles: [],
  });

  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalogs");
      if (res.ok) {
        const data = (await res.json()) as CatalogsData;
        setCatalogs(data);
      }
    } catch {
      showNotice("error", "Error al cargar catálogos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const handleToggleStatus = async (type: string, id: string) => {
    try {
      const res = await fetch(`/api/catalogs/${type}/${id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok || data.error) {
        showNotice("error", data.error || "No se pudo cambiar el estado");
        return;
      }
      showNotice("success", "Estado actualizado correctamente");
      fetchCatalogs();
    } catch {
      showNotice("error", "Error de comunicación con el servidor");
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    if (activeTab === "machines") {
      setFormData({
        code: "",
        name: "",
        areaId: catalogs.areas[0]?.id || "",
        status: "OPERATING",
      });
    } else if (activeTab === "users") {
      setFormData({
        name: "",
        email: "",
        password: "demo123",
        role: "OPERADOR",
        roleId: catalogs.roles.find((r) => r.name === "OPERADOR")?.id || "",
      });
    } else if (activeTab === "areas" || activeTab === "processes" || activeTab === "stop-types") {
      setFormData({ name: "", description: "" });
    } else if (activeTab === "stop-causes") {
      setFormData({ name: "", description: "", isRepairable: true });
    } else if (activeTab === "priorities") {
      setFormData({ name: "", level: 1, colorCode: "#3b82f6" });
    }
    setModalOpen(true);
  };

  const openEditModal = (item: BaseItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    if (activeTab === "machines") {
      setFormData({
        code: item.code || "",
        name: item.name || "",
        areaId: item.areaId || item.area?.id || "",
        status: item.status || "OPERATING",
      });
    } else if (activeTab === "users") {
      const roleStr = typeof item.role === "object" && item.role !== null ? item.role.name : String(item.role || "OPERADOR");
      setFormData({
        name: item.name || "",
        email: item.email || "",
        role: roleStr,
        status: item.status || "ACTIVE",
        password: "",
      });
    } else if (activeTab === "areas" || activeTab === "processes" || activeTab === "stop-types") {
      setFormData({ name: item.name || "", description: item.description || "" });
    } else if (activeTab === "stop-causes") {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        isRepairable: item.isRepairable ?? true,
      });
    } else if (activeTab === "priorities") {
      setFormData({
        name: item.name || "",
        level: item.level || 1,
        colorCode: item.colorCode || "#3b82f6",
      });
    }
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing
        ? `/api/catalogs/${activeTab}/${editingId}`
        : `/api/catalogs/${activeTab}`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showNotice("error", data.error || "Error al procesar la solicitud");
        setSubmitting(false);
        return;
      }

      showNotice(
        "success",
        isEditing ? "Registro actualizado con éxito" : "Registro creado con éxito"
      );
      setModalOpen(false);
      fetchCatalogs();
    } catch {
      showNotice("error", "Error de red al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de datos por pestaña y término de búsqueda
  const currentList = useMemo(() => {
    let items: BaseItem[] = [];
    if (activeTab === "machines") items = catalogs.machines || [];
    else if (activeTab === "users") items = catalogs.users || [];
    else if (activeTab === "areas") items = catalogs.areas || [];
    else if (activeTab === "processes") items = catalogs.processes || [];
    else if (activeTab === "stop-causes") items = catalogs.stopCauses || [];
    else if (activeTab === "stop-types") items = catalogs.stopTypes || [];
    else if (activeTab === "priorities") items = catalogs.priorities || [];

    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) =>
      item.name?.toLowerCase().includes(term) ||
      item.code?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  }, [catalogs, activeTab, search]);

  const tabs: Array<{ id: CatalogTab; label: string; icon: typeof Server; count: number }> = [
    { id: "machines", label: "Máquinas", icon: Server, count: catalogs.machines?.length || 0 },
    { id: "users", label: "Usuarios", icon: Users, count: catalogs.users?.length || 0 },
    { id: "areas", label: "Áreas", icon: MapPin, count: catalogs.areas?.length || 0 },
    { id: "processes", label: "Procesos", icon: Cog, count: catalogs.processes?.length || 0 },
    { id: "stop-causes", label: "Causas de Paro", icon: AlertTriangle, count: catalogs.stopCauses?.length || 0 },
    { id: "stop-types", label: "Tipos de Paro", icon: Timer, count: catalogs.stopTypes?.length || 0 },
    { id: "priorities", label: "Prioridades", icon: Flame, count: catalogs.priorities?.length || 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Notificación Flotante */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de Acciones y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Buscar en ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCatalogs}
            title="Refrescar datos"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-md shadow-rose-900/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* Tabla del Catálogo Activo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                {activeTab === "machines" && (
                  <>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">Estado Operativo</th>
                    <th className="px-4 py-3">Activa</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </>
                )}
                {activeTab === "users" && (
                  <>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo Electrónico</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </>
                )}
                {(activeTab === "areas" || activeTab === "processes" || activeTab === "stop-types") && (
                  <>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </>
                )}
                {activeTab === "stop-causes" && (
                  <>
                    <th className="px-4 py-3">Causa</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Reparable (MTTR)</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </>
                )}
                {activeTab === "priorities" && (
                  <>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Nivel</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron registros en este catálogo.
                  </td>
                </tr>
              ) : (
                currentList.map((item) => {
                  const isItemActive = item.active !== false && item.status !== "INACTIVE";

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition">
                      {/* Pestaña: Máquinas */}
                      {activeTab === "machines" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-white">{item.code}</td>
                          <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                          <td className="px-4 py-3 text-slate-400">{item.area?.name || item.areaName || "-"}</td>
                          <td className="px-4 py-3">
                            {(() => {
                              const cfg = MACHINE_STATUS_CONFIG[(item.status || "OPERATING") as MachineStatus] || {
                                label: item.status || "OPERATING",
                                badgeClass: "bg-slate-800 text-slate-300",
                                icon: "⚪",
                              };
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.badgeClass}`}>
                                  <span>{cfg.icon}</span>
                                  <span>{cfg.label}</span>
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isItemActive
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-400 border border-rose-800/40"
                            }`}>
                              {isItemActive ? "ACTIVA" : "INACTIVA"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Pestaña: Usuarios */}
                      {activeTab === "users" && (
                        <>
                          <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{item.email}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/30">
                              {typeof item.role === "object" && item.role !== null ? item.role.name : String(item.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "ACTIVE"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-400 border border-rose-800/40"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Pestañas: Áreas, Procesos, Tipos */}
                      {(activeTab === "areas" || activeTab === "processes" || activeTab === "stop-types") && (
                        <>
                          <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                          <td className="px-4 py-3 text-slate-400">{item.description || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isItemActive
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-400 border border-rose-800/40"
                            }`}>
                              {isItemActive ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Pestaña: Causas */}
                      {activeTab === "stop-causes" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                          <td className="px-4 py-3 text-slate-400">{item.description || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              item.isRepairable
                                ? "bg-blue-950 text-blue-400 border border-blue-800/40"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {item.isRepairable ? "Sí (Falla de equipo)" : "No (Operativo / Insumo)"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isItemActive
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-400 border border-rose-800/40"
                            }`}>
                              {isItemActive ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Pestaña: Prioridades */}
                      {activeTab === "priorities" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.colorCode || "#3b82f6" }}
                            />
                            <span>{item.name}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-300">Nivel {item.level}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{item.colorCode}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isItemActive
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-400 border border-rose-800/40"
                            }`}>
                              {isItemActive ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Botones de Acción */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Editar"
                            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(activeTab, item.id)}
                            title={isItemActive ? "Desactivar (Soft delete)" : "Activar"}
                            className={`p-1.5 rounded-md transition ${
                              isItemActive
                                ? "bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40"
                                : "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/40"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reutilizable de Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {isEditing ? "Editar Registro" : "Crear Nuevo Registro"} —{" "}
                <span className="text-rose-400">{tabs.find((t) => t.id === activeTab)?.label}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5 text-xs">
              {/* Formulario Máquinas */}
              {activeTab === "machines" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Código de Máquina *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CNC-03"
                      value={String(formData.code || "")}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Nombre de la Máquina *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresadora Vertical CNC"
                      value={String(formData.name || "")}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Área de Planta *
                    </label>
                    <select
                      value={String(formData.areaId || "")}
                      onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    >
                      {catalogs.areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Estado Inicial
                    </label>
                    <select
                      value={String(formData.status || "OPERATING")}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    >
                      <option value="OPERATING">🟢 Operando</option>
                      <option value="STOPPED">🔴 En paro</option>
                      <option value="MAINTENANCE">🟡 Mantenimiento</option>
                      <option value="OUT_OF_SERVICE">⚪ Fuera de servicio</option>
                    </select>
                  </div>
                </>
              )}

              {/* Formulario Usuarios */}
              {activeTab === "users" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fernando Morales"
                      value={String(formData.name || "")}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={isEditing}
                      placeholder="e.g. f.morales@stopcontrol.local"
                      value={String(formData.email || "")}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white disabled:opacity-50 focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Rol Asignado *
                    </label>
                    <select
                      value={String(formData.role || "OPERADOR")}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    >
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      <option value="OPERADOR">OPERADOR</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                      <option value="CALIDAD">CALIDAD</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      {isEditing ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña *"}
                    </label>
                    <input
                      type="password"
                      required={!isEditing}
                      placeholder={isEditing ? "••••••••" : "demo123"}
                      value={String(formData.password || "")}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Formulario Áreas, Procesos, Tipos */}
              {(activeTab === "areas" || activeTab === "processes" || activeTab === "stop-types") && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mecanizado Pesado"
                      value={String(formData.name || "")}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles u observaciones del catálogo..."
                      value={String(formData.description || "")}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Formulario Causas de Paro */}
              {activeTab === "stop-causes" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Nombre de la Causa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Falla neumática"
                      value={String(formData.name || "")}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles sobre el tipo de falla..."
                      value={String(formData.description || "")}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isRepairable"
                      checked={Boolean(formData.isRepairable)}
                      onChange={(e) => setFormData({ ...formData, isRepairable: e.target.checked })}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-rose-500"
                    />
                    <label htmlFor="isRepairable" className="text-slate-300 font-medium">
                      ¿Es una falla de equipo reparable? (Se computa para MTTR)
                    </label>
                  </div>
                </>
              )}

              {/* Formulario Prioridades */}
              {activeTab === "priorities" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                      Nombre de la Prioridad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Urgencia Máxima"
                      value={String(formData.name || "")}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                        Nivel Numérico (1-4)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={Number(formData.level || 1)}
                        onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                        Color Hexadecimal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={String(formData.colorCode || "#3b82f6")}
                          onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                          className="h-9 w-10 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={String(formData.colorCode || "#3b82f6")}
                          onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                          className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-rose-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-lg shadow-rose-900/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
