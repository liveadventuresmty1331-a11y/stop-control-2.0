import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { updateCatalogItem } from "@/lib/catalogs-service";

export async function PUT(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validación estricta de autorización RBAC en servidor
  if (session.role !== "ADMINISTRADOR") {
    return NextResponse.json(
      { error: "Acceso denegado: solo el Administrador puede modificar catálogos" },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await updateCatalogItem(params.type, params.id, body);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error al actualizar elemento en el catálogo";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
