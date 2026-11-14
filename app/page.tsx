import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getServerSession();

  // Iniciar el programa solicitando usuario y contraseña si no está autenticado
  if (!session) {
    redirect("/login");
  }

  // Si ya tiene sesión activa, dirigir al Home con las opciones principales
  redirect("/home");
}
