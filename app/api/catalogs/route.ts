import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getAllCatalogs } from "@/lib/catalogs-service";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const catalogs = await getAllCatalogs();
  return NextResponse.json(catalogs);
}
