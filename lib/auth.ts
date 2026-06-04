import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "admin" | "member";

const SESSION_COOKIE = "playbook_portal_session";

type Session = {
  role: Role;
  name: string;
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;

    if (parsed.role === "admin" || parsed.role === "member") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/portal");
  }

  return session;
}

export function createSessionValue(session: Session) {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}
