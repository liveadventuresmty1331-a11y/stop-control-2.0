import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HistoryView from "@/components/stops/HistoryView";

export default async function HistoryPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?from=/history");
  }

  return <HistoryView user={session} />;
}
