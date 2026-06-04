export type PlaybookPage = {
  id: string;
  title: string;
  slug: string;
  section: string;
  excerpt: string;
  content: string;
  status: "draft" | "published";
  audience: "internal" | "client" | "all";
  sort_order: number;
  updated_at: string;
};

const seedPages: PlaybookPage[] = [
  {
    id: "seed-1",
    title: "Welcome to the Playbook",
    slug: "welcome",
    section: "Start Here",
    excerpt: "The first page your team or clients see after logging in.",
    content:
      "## How this portal works\n\nUse the sidebar to browse playbook sections. Admins can edit pages, create drafts, and publish updates.\n\nThis seed content is here so the app works before a Notion export is imported.",
    status: "published",
    audience: "all",
    sort_order: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: "seed-2",
    title: "Client Onboarding",
    slug: "client-onboarding",
    section: "Client Portal",
    excerpt: "A template page for customer-facing processes.",
    content:
      "## Onboarding steps\n\n1. Confirm account owner and access level.\n2. Capture goals, constraints, and timelines.\n3. Share the relevant playbook section.\n4. Schedule the first review.",
    status: "published",
    audience: "client",
    sort_order: 2,
    updated_at: new Date().toISOString()
  }
];

function requireSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    key
  };
}

export async function supabaseFetch(path: string, options: RequestInit = {}) {
  const config = requireSupabaseEnv();

  if (!config) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

export async function listPages(options: { includeDrafts?: boolean } = {}) {
  if (!requireSupabaseEnv()) {
    return seedPages.filter((page) => options.includeDrafts || page.status === "published");
  }

  const statusFilter = options.includeDrafts ? "" : "&status=eq.published";
  const response = await supabaseFetch(
    `playbook_pages?select=*&order=sort_order.asc,updated_at.desc${statusFilter}`
  );

  if (!response.ok) {
    throw new Error("Could not load playbook pages.");
  }

  return parseResponse<PlaybookPage[]>(response);
}

export async function getPage(slug: string, options: { includeDrafts?: boolean } = {}) {
  const pages = await listPages(options);
  return pages.find((page) => page.slug === slug) || null;
}
