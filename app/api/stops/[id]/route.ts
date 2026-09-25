import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStopDetailById } from "@/lib/stops-service";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "El identificador del paro es obligatorio." },
        { status: 400 }
      );
    }

    const stop = await getStopDetailById(id, session);
    return NextResponse.json(stop);
  } catch (err: unknown) {
    const error = err as Error;
    const msg = error.message || "Error al consultar el detalle del paro.";

    if (msg.includes("No autorizado") || msg.includes("Acceso denegado") || msg.includes("permisos")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes("no fue encontrado")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
