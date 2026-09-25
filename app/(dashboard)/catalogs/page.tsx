import { getServerSession } from "@/lib/auth";
import { Layers, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
            <h1 className="text-xl font-bold text-white">Administración de Catálogos</h1>
          </div>
          <p className="text-xs text-slate-400">
            Ruta exclusiva para usuarios con rol de Administrador.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-purple-300 text-sm font-semibold">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>Acceso Exclusivo Concedido: {session.name} ({session.role})</span>
        </div>
        <p className="text-xs text-slate-400">
          Esta vista está protegida tanto en el middleware como a nivel de componente de servidor. La gestión completa de catálogos (CRUD) se implementará en la Fase 4.
        </p>
      </div>
    </div>
  );
}
