import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { exportHistoryToCSV, HistoryQueryFilters } from "@/lib/stops-service";

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
    };

    const csvData = await exportHistoryToCSV(filters, session);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stopcontrol_historial_${dateStr}.csv"`,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    const msg = error.message || "Error al exportar a CSV.";

    if (msg.includes("No autorizado") || msg.includes("Acceso denegado") || msg.includes("permisos")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
