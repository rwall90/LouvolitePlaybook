import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listPages } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  await requireSession();
  const pages = await listPages();
  redirect(pages[0] ? `/wiki/${pages[0].slug}` : "/portal");
}
