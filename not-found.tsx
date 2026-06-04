import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-state">
      <div>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="muted">That playbook page is not available to this role.</p>
        <Link className="button" href="/portal">
          Back to portal
        </Link>
      </div>
    </main>
  );
}
