import { getServerSession } from "@/lib/auth";
import { Layers } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogsView from "@/components/catalogs/CatalogsView";

export default async function CatalogsPage() {
  const session = await getServerSession();

  // Validación estricta en servidor
  if (!session || session.role !== "ADMINISTRADOR") {
    redirect("/dashboard?unauthorized=1");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Catálogos Maestros del Sistema</h1>
          </div>
          <p className="text-xs text-slate-400">
            Administración centralizada de máquinas, usuarios, áreas, procesos y parámetros de paro.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <CatalogsView />
    </div>
  );
}
