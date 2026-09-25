import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { toggleItemStatus } from "@/lib/catalogs-service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validación estricta de autorización RBAC en servidor
  if (session.role !== "ADMINISTRADOR") {
    return NextResponse.json(
      { error: "Acceso denegado: solo el Administrador puede activar o desactivar registros" },
      { status: 403 }
    );
  }

  try {
    const updated = await toggleItemStatus(params.type, params.id);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error al cambiar el estado del registro";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
