import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createCatalogItem } from "@/lib/catalogs-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validación estricta de autorización RBAC en servidor
  if (session.role !== "ADMINISTRADOR") {
    return NextResponse.json(
      { error: "Acceso denegado: solo el Administrador puede crear registros en los catálogos" },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const created = await createCatalogItem(params.type, body);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error al crear elemento en el catálogo";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
