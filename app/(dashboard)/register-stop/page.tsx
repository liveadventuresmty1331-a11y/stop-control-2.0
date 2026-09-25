import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllCatalogs } from "@/lib/catalogs-service";
import RegisterStopForm from "@/components/stops/RegisterStopForm";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default async function RegisterStopPage() {
  const session = await getServerSession();

  // Validación estricta en servidor: Solo Operadores y Administradores pueden registrar paros
  if (!session || (session.role !== "OPERADOR" && session.role !== "ADMINISTRADOR")) {
    redirect("/dashboard?unauthorized=1");
  }

  const catalogs = await getAllCatalogs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Registrar Paro de Maquinaria</h1>
          </div>
          <p className="text-xs text-slate-400">
            Apertura y cronometraje oficial de eventos de paro en líneas de producción.
          </p>
        </div>

        <Link
          href="/active-stops"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
        >
          ← Ver Paros Activos
        </Link>
      </div>

      <RegisterStopForm
        user={session}
        machines={catalogs.machines}
        areas={catalogs.areas}
        processes={catalogs.processes}
        stopTypes={catalogs.stopTypes}
        causes={catalogs.stopCauses}
        priorities={catalogs.priorities}
      />
    </div>
  );
}
