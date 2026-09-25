import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActiveStopsView from "@/components/stops/ActiveStopsView";

export default async function ActiveStopsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <ActiveStopsView user={session} />;
}
