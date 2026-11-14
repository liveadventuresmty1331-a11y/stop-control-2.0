import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  PlusCircle, 
  Layers, 
  History, 
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
  Lock,
  Cpu,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { unauthorized?: string };
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const wasDenied = searchParams?.unauthorized === "1";
  const isAdmin = session.role === "ADMINISTRADOR";
  const canRegister = isAdmin || session.role === "OPERADOR";

  // Las 5 Opciones Principales del Home en el orden exacto solicitado:
  const HOME_OPTIONS = [
    {
      id: "register-stop",
      title: "Registrar Paro",
      subtitle: "Captura Inmediata de Incidencia",
      description: "Reportar un nuevo evento de paro seleccionando máquina, área, proceso, tipo de falla, causa raíz y turno operativo.",
      icon: PlusCircle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/25",
      hoverBorder: "hover:border-amber-500/50",
      btnBg: "bg-amber-600 hover:bg-amber-500",
      href: "/register-stop",
      badge: canRegister ? "Captura Inmediata" : "Operador / Admin",
      enabled: canRegister,
      allowedRolesText: "Operador y Administrador",
    },
    {
      id: "active-stops",
      title: "Paros Activos",
      subtitle: "Control y Cierre de Eventos en Vivo",
      description: "Monitoreo de máquinas detenidas en vivo con cronómetro auditado en servidor segundo a segundo y cierre con orden de trabajo.",
      icon: Activity,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/25",
      hoverBorder: "hover:border-emerald-500/50",
      btnBg: "bg-emerald-600 hover:bg-emerald-500",
      href: "/active-stops",
      badge: "Cronómetro en Vivo",
      enabled: true,
      allowedRolesText: "Todos los perfiles",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      subtitle: "Panel de KPIs y Control de Planta",
      description: "Monitoreo en tiempo real, disponibilidad operativa, estado de las 6 máquinas, gráficos de tendencias y filtros por mes.",
      icon: LayoutDashboard,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/25",
      hoverBorder: "hover:border-rose-500/50",
      btnBg: "bg-rose-600 hover:bg-rose-500",
      href: "/dashboard",
      badge: "Tiempo Real",
      enabled: true,
      allowedRolesText: "Todos los perfiles",
    },
    {
      id: "history",
      title: "Historial",
      subtitle: "Trazabilidad y Exportación a Excel",
      description: "Auditoría histórica de todos los paros cerrados con filtros multicriterio, paginación y descarga en CSV con BOM UTF-8.",
      icon: History,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/25",
      hoverBorder: "hover:border-blue-500/50",
      btnBg: "bg-blue-600 hover:bg-blue-500",
      href: "/history",
      badge: "Exportar CSV",
      enabled: true,
      allowedRolesText: "Todos los perfiles",
    },
    {
      id: "catalogs",
      title: "Catálogos",
      subtitle: "Configuración Maestra de Planta",
      description: "Administración centralizada de maquinaria, áreas industriales, procesos operativos, causas raíz y niveles de prioridad.",
      icon: Layers,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/25",
      hoverBorder: "hover:border-purple-500/50",
      btnBg: "bg-purple-600 hover:bg-purple-500",
      href: "/catalogs",
      badge: isAdmin ? "Gestión Maestra" : "Solo Administrador",
      enabled: isAdmin,
      allowedRolesText: "Solo Administrador",
    },
  ];

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Aviso de permiso si intentó acceder a una ruta restringida */}
      {wasDenied && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-sm shadow-md animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Acceso restringido por permisos de rol (RBAC)</p>
            <p className="text-xs text-amber-400/80">
              Tu perfil actual (<strong className="uppercase">{session.role}</strong>) no tiene privilegios para acceder al módulo solicitado. Selecciona una opción habilitada a continuación.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Bienvenida del Home */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        {/* Resplandor decorativo sutil */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Portal Principal • STOPControl 2.0
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sesión Activa
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>¡Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400">{session.name}</span>!</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Has ingresado al sistema como <strong className="text-slate-200 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80">{session.role}</strong>. Selecciona una de las 5 opciones operativas para comenzar a trabajar:
          </p>
        </div>

        {/* Insignia Institucional UIN integrada */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center relative z-10 pl-0 md:pl-6 md:border-l md:border-slate-800/80">
          <img
            src="/uin-logo.png"
            alt="Universidad Interamericana del Norte"
            className="h-10 sm:h-12 w-auto object-contain filter brightness-125"
            title="Universidad Interamericana del Norte"
          />
        </div>
      </div>

      {/* Grid de las 5 Opciones Principales del Home */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-500" />
            <span>Módulos de Control del Sistema</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">5 Opciones Disponibles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOME_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isFullSpan = index === 4; // La 5ta opción se acomoda limpiamente

            return (
              <div
                key={option.id}
                className={`group rounded-2xl border ${option.borderColor} ${option.hoverBorder} bg-slate-900/60 hover:bg-slate-900/90 p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
                  isFullSpan ? "md:col-span-2 lg:col-span-1" : ""
                } ${!option.enabled ? "opacity-75" : ""}`}
              >
                {/* Encabezado de la Tarjeta */}
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${option.bgColor} ${option.color} border ${option.borderColor} shadow-inner`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      option.enabled 
                        ? `${option.bgColor} ${option.color} ${option.borderColor}`
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {option.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition flex items-center justify-between">
                      <span>{option.title}</span>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition" />
                    </h3>
                    <p className="text-xs font-semibold text-slate-300 mt-0.5">
                      {option.subtitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Pie de la Tarjeta con Botón de Entrada */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 relative z-10">
                  <span className="text-[11px] text-slate-400">
                    {option.allowedRolesText}
                  </span>

                  {option.enabled ? (
                    <Link
                      href={option.href}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl ${option.btnBg} text-white transition shadow-md hover:scale-[1.02]`}
                    >
                      <span>Entrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Restringido</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen Informativo de Planta en la Parte Inferior */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sistema verificado con control de acceso por roles (RBAC) • STOPControl 2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-white transition underline underline-offset-4">
            Dashboard
          </Link>
          <span>•</span>
          <Link href="/active-stops" className="hover:text-white transition underline underline-offset-4">
            Paros Activos
          </Link>
          <span>•</span>
          <Link href="/history" className="hover:text-white transition underline underline-offset-4">
            Historial
          </Link>
        </div>
      </div>
    </div>
  );
}
