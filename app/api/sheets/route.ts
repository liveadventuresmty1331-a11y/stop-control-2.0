import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { testGoogleSheetsConnection, syncStopCreated, syncStopCompleted, syncWorkOrder } from "@/lib/google-sheets";
import { getAllCatalogs } from "@/lib/catalogs-service";
import { memoryStops, memoryWorkOrders } from "@/lib/stops-service";
import { db } from "@/lib/db";

/**
 * GET: Probar el estado de conexión con Google Sheets
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const result = await testGoogleSheetsConnection();
  return NextResponse.json(result);
}

/**
 * POST: Sincronización masiva inicial de datos existentes hacia Google Sheets
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.role !== "ADMINISTRADOR") {
    return NextResponse.json(
      { error: "Acceso denegado: solo el Administrador puede forzar la sincronización masiva" },
      { status: 403 }
    );
  }

  try {
    let stops = [];
    try {
      stops = await db.stop.findMany({
        include: {
          machine: true,
          area: true,
          process: true,
          stopType: true,
          cause: true,
          priority: true,
          operator: { select: { id: true, name: true, email: true } },
          technician: { select: { id: true, name: true, email: true } },
          workOrder: true,
        },
        orderBy: { startTime: "asc" },
      });
    } catch {
      stops = memoryStops;
    }

    let syncedCount = 0;
    for (const stop of stops) {
      await syncStopCreated(stop);
      if (stop.status === "COMPLETED") {
        await syncStopCompleted(stop);
      }
      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Se sincronizaron exitosamente ${syncedCount} registros con Google Sheets.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
