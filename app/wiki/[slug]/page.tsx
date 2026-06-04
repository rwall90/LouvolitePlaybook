import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { WikiSidebar } from "@/components/WikiSidebar";
import { MarkdownView } from "@/lib/markdown";
import { requireSession } from "@/lib/auth";
import { getPage, listPages } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireSession();
  const { slug } = await params;
  const pages = await listPages();
  const visiblePages =
    session.role === "admin"
      ? pages
      : pages.filter((page) => page.audience === "all" || page.audience === "client");
  const page = await getPage(slug);

  if (!page || !visiblePages.some((visiblePage) => visiblePage.slug === page.slug)) {
    notFound();
  }

  return (
    <div className="shell">
      <Topbar />
      <main className="main content-grid">
        <WikiSidebar pages={visiblePages} activeSlug={page.slug} />
        <article className="article panel">
          <header className="article-header">
            <div>
              <p className="eyebrow">{page.section}</p>
              <h1>{page.title}</h1>
              {page.excerpt ? <p className="muted">{page.excerpt}</p> : null}
            </div>
            {session.role === "admin" ? (
              <Link className="button outline" href={`/admin?selected=${page.slug}`}>
                Edit
              </Link>
            ) : null}
          </header>
          <MarkdownView content={page.content} notionPath={page.notion_path} />
        </article>
      </main>
    </div>
  );
}
