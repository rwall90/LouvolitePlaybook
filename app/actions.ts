"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionValue, requireAdmin, sessionCookieName } from "@/lib/auth";
import { importNotionPlaybook } from "@/lib/notion";
import { supabaseFetch } from "@/lib/supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export async function login(_prevState: { message: string }, formData: FormData) {
  const password = String(formData.get("password") || "");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const memberPassword = process.env.MEMBER_PASSWORD;
  const role =
    adminPassword && password === adminPassword
      ? "admin"
      : memberPassword && password === memberPassword
        ? "member"
        : null;

  if (!role) {
    return { message: "That password does not match an active portal role." };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), createSessionValue({ role, name: role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  redirect(role === "admin" ? "/admin" : "/portal");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
  redirect("/login");
}

export async function savePage(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const section = String(formData.get("section") || "Playbook").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const audience = String(formData.get("audience") || "all");
  const status = String(formData.get("status") || "draft");
  const content = String(formData.get("content") || "").trim();

  if (!title || !slug || !content) {
    throw new Error("Title, slug, and content are required.");
  }

  const payload = {
    title,
    slug,
    section,
    excerpt,
    audience,
    status,
    content,
    sort_order: Number(formData.get("sort_order") || 100)
  };

  if (id) {
    const response = await supabaseFetch(`playbook_pages?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Could not update page.");
    }
  } else {
    const response = await supabaseFetch("playbook_pages", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Could not create page.");
    }
  }

  redirect(`/admin?selected=${slug}`);
}

export async function importFromNotion() {
  await requireAdmin();
  const imported = await importNotionPlaybook();
  redirect(`/admin?imported=${imported.length}`);
}
