import Link from "next/link";
import { Topbar } from "@/components/Topbar";

export default function HomePage() {
  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="hero-row">
          <div className="hero-copy">
            <p className="eyebrow">Private knowledge base</p>
            <h1>Turn your Notion playbook into a client portal.</h1>
            <p>
              A logged-in, role-aware wiki for internal teams and customer-facing
              content, with admin editing and Supabase-backed storage.
            </p>
            <div className="editor-actions">
              <Link className="button" href="/login">
                Open portal
              </Link>
              <Link className="button secondary" href="/wiki">
                Browse wiki
              </Link>
            </div>
          </div>
          <aside className="panel">
            <p className="eyebrow">MVP included</p>
            <div className="stats">
              <div className="stat card">
                <strong>2</strong>
                <span>Portal roles</span>
              </div>
              <div className="stat card">
                <strong>CMS</strong>
                <span>Admin editing</span>
              </div>
              <div className="stat card">
                <strong>ZIP</strong>
                <span>Notion import path</span>
              </div>
              <div className="stat card">
                <strong>RLS</strong>
                <span>Supabase ready</span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
