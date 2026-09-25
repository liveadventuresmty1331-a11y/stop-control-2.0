import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createStop, CreateStopInput } from "@/lib/stops-service";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validación estricta en servidor: Solo Operadores y Administradores pueden registrar paros
  if (session.role !== "ADMINISTRADOR" && session.role !== "OPERADOR") {
    return NextResponse.json(
      { error: "Acceso denegado: solo Operadores y Administradores tienen permisos para registrar paros." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as CreateStopInput;
    const stop = await createStop(body, session);
    return NextResponse.json({ success: true, stop }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al registrar el paro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
