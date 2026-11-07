import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Fondo: Marca de agua institucional UIN más grande y visible en el fondo de la app */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/uin-logo.png"
          alt=""
          className="w-[560px] sm:w-[850px] lg:w-[1050px] max-w-[90vw] opacity-[0.08] object-contain filter brightness-150 pointer-events-none"
        />
      </div>


      <Navbar user={session} />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 relative z-10">
        {children}
      </div>
    </div>
  );
}
