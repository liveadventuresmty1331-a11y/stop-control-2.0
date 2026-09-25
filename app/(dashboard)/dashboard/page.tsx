import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getAllCatalogs } from "@/lib/catalogs-service";
import { getDashboardData } from "@/lib/dashboard-service";
import DashboardView from "@/components/dashboard/DashboardView";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { unauthorized?: string };
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const wasDenied = searchParams?.unauthorized === "1";

  // Pre-carga en el servidor para renderizado instantáneo y sin parpadeos (SSR)
  const [catalogs, initialData] = await Promise.all([
    getAllCatalogs(),
    getDashboardData({}, session),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Alerta si fue denegado por RBAC en alguna otra acción */}
      {wasDenied && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-sm shadow-md">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Acceso no autorizado restringido por el servidor (RBAC)</p>
            <p className="text-xs text-amber-400/80">
              Tu rol actual (<strong className="uppercase">{session.role}</strong>) no cuenta con privilegios para la ruta solicitada.
            </p>
          </div>
        </div>
      )}

      {/* Vista Principal del Tablero de Control de Planta */}
      <DashboardView
        initialData={initialData}
        user={session}
        catalogs={{
          areas: catalogs.areas.map((a) => ({ id: a.id, name: a.name })),
          machines: catalogs.machines.map((m) => ({
            id: m.id,
            name: m.name,
            code: m.code,
            areaId: m.areaId,
          })),
          stopCauses: catalogs.stopCauses.map((c) => ({ id: c.id, name: c.name })),
        }}
      />
    </div>
  );
}
