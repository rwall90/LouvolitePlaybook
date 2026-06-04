import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="topbar">
      <Link className="brand" href={session ? "/portal" : "/"}>
        <span className="brand-mark">P</span>
        <span>Playbook Portal</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {session ? (
          <>
            <Link href="/portal">Portal</Link>
            <Link href="/wiki">Wiki</Link>
            {session.role === "admin" ? <Link href="/admin">Admin</Link> : null}
            <form action={logout}>
              <button type="submit">Log out</button>
            </form>
          </>
        ) : (
          <Link href="/login">Log in</Link>
        )}
      </nav>
    </header>
  );
}
