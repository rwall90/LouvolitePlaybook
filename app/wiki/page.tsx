import { redirect } from "next/navigation";
import { listPages } from "@/lib/supabase";

export default async function WikiIndexPage() {
  const pages = await listPages();
  redirect(pages[0] ? `/wiki/${pages[0].slug}` : "/portal");
}
