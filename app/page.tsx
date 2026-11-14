import Link from "next/link";
import { 
  Activity, 
  Clock, 
  BarChart3, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  ArrowRight,
  LayoutDashboard,
  PlusCircle,
  History,
  PieChart,
  Cpu,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Flame,
  Settings
} from "lucide-react";
import { getServerSession } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();

  const MODULES = [
    {
      title: "Dashboard de KPIs y Planta",
      description: "Visualización integral de disponibilidad, estado de máquinas en tiempo real, tendencias y filtros mensuales.",
      icon: LayoutDashboard,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      href: "/dashboard",
      badge: "Tiempo Real",
    },
    {
      title: "Paros Activos y Cronometría",
      description: "Monitoreo en vivo de máquinas fuera de servicio con cronómetro segundo a segundo auditado con UTC.",
      icon: Activity,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      href: "/active-stops",
      badge: "Cronómetro Vivo",
    },
    {
      title: "Registro Inmediato de Paros",
      description: "Captura ágil de incidencias por máquina, área, proceso, criticidad, causa raíz y turno operativo.",
      icon: PlusCircle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      href: "/register-stop",
      badge: "Operativo",
    },
    {
      title: "Análisis Pareto 80/20 y MTTR/MTBF",
      description: "Identificación de los pocos vitales y métricas estandarizadas de confiabilidad (MTTR, MTBF y Disponibilidad).",
      icon: PieChart,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      href: "/dashboard?tab=pareto",
      badge: "Ingeniería",
    },
    {
      title: "Historial y Trazabilidad",
      description: "Auditoría histórica completa con filtros multicriterio, paginación y exportación de datos a Excel / CSV.",
      icon: History,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      href: "/history",
      badge: "Exportación CSV",
    },
    {
      title: "Catálogos Maestros y RBAC",
      description: "Gestión centralizada de estaciones de trabajo, áreas, procesos industriales y perfiles de acceso con RBAC.",
      icon: Settings,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      href: "/catalogs",
      badge: "Administración",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Fondo: Marca de agua institucional de la Universidad UIN */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/uin-logo.png"
          alt=""
          className="w-[580px] sm:w-[920px] max-w-[85vw] opacity-[0.045] object-contain filter brightness-150 pointer-events-none"
        />
      </div>

      {/* Resplandor decorativo de iluminación industrial */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1100px] h-[360px] bg-rose-600/10 blur-[140px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      {/* Header Superior del Home */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Identidad Institucional UIN + STOPControl */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Logo de la Universidad (sin fondo blanco) */}
            <Link href="/" className="flex items-center shrink-0 hover:opacity-90 transition">
              <img
                src="/uin-logo.png"
                alt="Universidad Interamericana del Norte"
                className="h-8 sm:h-11 w-auto object-contain filter brightness-125"
                title="Universidad Interamericana del Norte"
              />
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Marca de la Aplicación */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-lg bg-rose-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-rose-900/40 group-hover:bg-rose-500 transition">
                ST
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white group-hover:text-rose-400 transition">
                    STOPControl
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                    2.0
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden md:block">
                  Control de Paros & Confiabilidad de Planta
                </span>
              </div>
            </Link>
          </div>

          {/* Estado del Sistema y Botón de Entrada */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistema en Línea • Planta Conectada</span>
            </div>

            {session ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200">{session.name}</span>
                  <span className="text-[10px] text-rose-400 font-mono font-semibold uppercase">{session.role}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/30"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Ir al Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/30"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal del Home */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-12 sm:gap-16 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-rose-400 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">
              Plataforma Central de Control Operativo e Industria 4.0
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
            Monitoreo en Tiempo Real y Control de <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400">Paros de Maquinaria</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Centraliza la trazabilidad de fallas en planta, audita la duración exacta de paros con cronómetro en servidor, calcula disponibilidad industrial (<strong>MTTR / MTBF</strong>) y elimina registros dispersos en papel.
          </p>

          {/* Botones de Acción Primarios */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-xl shadow-rose-900/40 transition hover:scale-[1.02]"
            >
              <span>{session ? "Continuar al Dashboard" : "Ingresar al Software"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={session ? "/active-stops" : "/login?callbackUrl=/active-stops"}
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 transition hover:border-slate-700"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Ver Paros Activos</span>
            </Link>

            <a
              href="#modulos"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 transition"
            >
              <span>Explorar Módulos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Banner de Estado Rápido y Métricas Clave de la Plataforma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3.5 shadow-md">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Infraestructura</span>
              <h3 className="text-sm font-bold text-white mt-0.5">6 Estaciones de Planta</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tornos CNC, Soldadoras, Ensamble, Pintura y Taladro.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3.5 shadow-md">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Precisión</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Cronómetro Auditado</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tiempos auditados con marcas UTC, inmunes a cierres o F5.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3.5 shadow-md">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Confiabilidad</span>
              <h3 className="text-sm font-bold text-white mt-0.5">MTTR & MTBF Riguroso</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fórmulas estándar de disponibilidad y análisis de causas 80/20.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3.5 shadow-md">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Integración</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Excel & Google Sheets</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sincronización en la nube y descarga en CSV con BOM UTF-8.</p>
            </div>
          </div>
        </div>

        {/* Sección de Módulos del Sistema */}
        <div id="modulos" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <h2 className="text-xl font-bold text-white tracking-tight">Módulos Centrales del Software</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Herramientas operativas diseñadas para supervisión, control de piso y gerencia de mantenimiento.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">STOPControl 2.0 • 6 Áreas de Control</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  href={session ? mod.href : `/login?callbackUrl=${encodeURIComponent(mod.href)}`}
                  className="group rounded-xl border border-slate-800/90 bg-slate-900/50 hover:bg-slate-900/90 p-5 flex flex-col justify-between gap-4 transition duration-300 hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${mod.bgColor} ${mod.color} border ${mod.borderColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60">
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-rose-400 transition flex items-center justify-between">
                        <span>{mod.title}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition" />
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300 transition">
                    <span>{session ? "Abrir módulo" : "Ingresar al módulo"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Perfiles de Acceso Rápido (Roles RBAC) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Perfiles de Acceso y Roles (RBAC)</h2>
                <p className="text-xs text-slate-400">Selecciona tu perfil de usuario para ingresar directamente al sistema.</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">Contraseña demo: demo123</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {DEMO_USERS.map((user) => (
              <Link
                key={user.role}
                href={`/login?email=${encodeURIComponent(user.email)}`}
                className="group p-4 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700 flex flex-col justify-between gap-3 transition hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">
                      {user.role}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1 group-hover:text-slate-100">{user.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{user.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                    {user.email.split('@')[0]}
                  </span>
                  <span className="text-[11px] font-bold text-rose-400 group-hover:underline">
                    Entrar →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* Footer Institucional del Home */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/uin-logo.png"
              alt="Universidad Interamericana del Norte"
              className="h-8 sm:h-9 w-auto object-contain filter brightness-125"
            />
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Universidad Interamericana del Norte</span>
              <p className="text-[11px] text-slate-400">STOPControl 2.0 • Sistema de Gestión y Control de Paros Industriales</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              v2.0 • Producción
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
