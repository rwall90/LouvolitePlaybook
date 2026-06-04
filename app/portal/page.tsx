import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { requireSession } from "@/lib/auth";
import { listPages } from "@/lib/supabase";

export default async function PortalPage() {
  const session = await requireSession();
  const pages = await listPages();
  const clientPages = pages.filter((page) => page.audience === "all" || page.audience === "client");
  const internalPages = pages.filter((page) => page.audience === "all" || page.audience === "internal");
  const visiblePages = session.role === "admin" ? pages : clientPages;

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="hero-row">
          <div className="hero-copy">
            <p className="eyebrow">Portal</p>
            <h1>Welcome back.</h1>
            <p>
              Your playbook is ready for customers, internal users, and admins
              who need to keep the source material current.
            </p>
          </div>
          <div className="panel">
            <p className="eyebrow">Signed in as</p>
            <h2>{session.role === "admin" ? "Admin" : "Member"}</h2>
            <p className="muted">
              {session.role === "admin"
                ? "You can edit and publish pages."
                : "You have read access to published portal content."}
            </p>
          </div>
        </section>

        <section className="dashboard-grid" aria-label="Portal overview">
          <Link className="card" href="/wiki">
            <h3>Browse wiki</h3>
            <p>{visiblePages.length} published pages available to your role.</p>
          </Link>
          <div className="card">
            <h3>Client content</h3>
            <p>{clientPages.length} pages are marked for clients or everyone.</p>
          </div>
          <div className="card">
            <h3>Internal content</h3>
            <p>{internalPages.length} pages are marked internal or shared.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
