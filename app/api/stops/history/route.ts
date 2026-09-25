import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStopsHistory, HistoryQueryFilters } from "@/lib/stops-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const filters: HistoryQueryFilters = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      machineId: searchParams.get("machineId") || undefined,
      areaId: searchParams.get("areaId") || undefined,
      processId: searchParams.get("processId") || undefined,
      stopTypeId: searchParams.get("stopTypeId") || undefined,
      causeId: searchParams.get("causeId") || undefined,
      priorityId: searchParams.get("priorityId") || undefined,
      shift: searchParams.get("shift") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as HistoryQueryFilters["sortBy"]) || undefined,
      sortOrder: (searchParams.get("sortOrder") as HistoryQueryFilters["sortOrder"]) || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : undefined,
    };

    const result = await getStopsHistory(filters, session);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    const msg = error.message || "Error al consultar el historial.";

    if (msg.includes("No autorizado") || msg.includes("Acceso denegado") || msg.includes("permisos")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
