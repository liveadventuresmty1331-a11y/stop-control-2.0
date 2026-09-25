import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getDashboardData, DashboardFilters } from "@/lib/dashboard-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard
 * Endpoint seguro para obtener los KPIs, estado de máquinas y gráficos del Dashboard (FASE 8)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Validar autenticación de sesión en servidor
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Usuario no autenticado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "Usuario inactivo o suspendido." },
        { status: 403 }
      );
    }

    // 2. Extraer parámetros de búsqueda de la URL
    const { searchParams } = new URL(req.url);
    const filters: DashboardFilters = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      machineId: searchParams.get("machineId") || undefined,
      areaId: searchParams.get("areaId") || undefined,
      causeId: searchParams.get("causeId") || undefined,
      shift: searchParams.get("shift") || undefined,
    };

    // 3. Ejecutar cálculo de KPIs en el servicio central
    const data = await getDashboardData(filters, session);

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error en GET /api/dashboard:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al calcular datos del dashboard" },
      { status: 500 }
    );
  }
}
