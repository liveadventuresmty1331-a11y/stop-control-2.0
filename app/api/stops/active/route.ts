import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getActiveStops } from "@/lib/stops-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ownOnly = searchParams.get("own") === "true";

  // Si es operador y pide solo sus paros
  const isOperatorOnly = session.role === "OPERADOR" && ownOnly;
  const stops = await getActiveStops(session.id, isOperatorOnly);

  return NextResponse.json(stops);
}
