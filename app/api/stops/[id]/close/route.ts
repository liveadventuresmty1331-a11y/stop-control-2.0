import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { closeStop, CloseStopInput } from "@/lib/stops-service";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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

    const body = (await req.json()) as CloseStopInput;

    const updatedStop = await closeStop(id, body, session);

    return NextResponse.json(
      {
        message: "Paro de máquina cerrado exitosamente.",
        stop: updatedStop,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    const msg = error.message || "Error interno al cerrar el paro.";

    if (msg.includes("No autorizado") || msg.includes("Acceso denegado") || msg.includes("permisos")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes("no existe")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (
      msg.includes("obligatoria") ||
      msg.includes("ya ha sido cerrado") ||
      msg.includes("no se encuentra activo") ||
      msg.includes("anterior a la hora de inicio")
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
