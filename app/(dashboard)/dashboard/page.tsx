import Link from "next/link";
import { getServerSession, ROLE_PERMISSIONS } from "@/lib/auth";
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, AlertTriangle, Layers, Activity, History } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { unauthorized?: string };
}) {
  const session = await getServerSession();
  const permissions = session ? ROLE_PERMISSIONS[session.role] || [] : [];
  const wasDenied = searchParams?.unauthorized === "1";

  return (
    <div className="flex flex-col gap-6">
      {/* Alerta si fue denegado por RBAC */}
      {wasDenied && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Acceso no autorizado restringido por el servidor (RBAC)</p>
            <p className="text-xs text-amber-400/80">
              Tu rol actual (<strong className="uppercase">{session?.role}</strong>) no cuenta con privilegios para la ruta solicitada.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Bienvenida y Verificación de Sesión */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Panel de Control • Fase 3 Activa
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sesión Verificada
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bienvenido, {session?.name}
          </h1>
          <p className="text-sm text-slate-400">
            Has iniciado sesión exitosamente con el rol de <strong className="text-slate-200">{session?.role}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">ID de Usuario</span>
            <span className="text-xs font-mono font-bold text-slate-300">{session?.id}</span>
          </div>
        </div>
      </div>

      {/* Grid de Permisos y Matriz RBAC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Permisos Activos del Usuario */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Permisos Otorgados por tu Rol</h2>
          </div>
          <p className="text-xs text-slate-400">
            Acciones permitidas y evaluadas estrictamente en servidor para el rol{" "}
            <span className="font-mono text-rose-400">{session?.role}</span>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs text-slate-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px] truncate">{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verificación de Rutas Protegidas */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">Rutas Protegidas y Pruebas RBAC</h2>
          </div>
          <p className="text-xs text-slate-400">
            Prueba la validación de servidor haciendo clic en las siguientes rutas según tu rol:
          </p>

          <div className="flex flex-col gap-2">
            <Link
              href="/active-stops"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="text-xs font-semibold text-white group-hover:text-rose-400 transition">
                    /active-stops
                  </span>
                  <p className="text-[11px] text-slate-500">Paros Activos (Todos los roles)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
            </Link>

            <Link
              href="/catalogs"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold text-white group-hover:text-purple-400 transition">
                    /catalogs
                  </span>
                  <p className="text-[11px] text-slate-500">Catálogos Maestros (Solo ADMINISTRADOR)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
            </Link>

            <Link
              href="/history"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                    /history
                  </span>
                  <p className="text-[11px] text-slate-500">Historial y Filtros</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
