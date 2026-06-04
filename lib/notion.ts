import { parseResponse, supabaseFetch } from "@/lib/supabase";

const NOTION_VERSION = "2022-06-28";

type NotionRichText = {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
};

type NotionBlock = {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
};

type ImportedPage = {
  notionPageId: string;
  title: string;
  slug: string;
  section: string;
  excerpt: string;
  content: string;
};

type StoredPage = {
  id: string;
  notion_page_id: string;
};

export type NotionBlockContent = {
  richText?: NotionRichText[];
  color?: string;
  checked?: boolean;
  language?: string;
  url?: string;
  caption?: NotionRichText[];
  title?: string;
  slug?: string;
};

export type PlaybookBlock = {
  id: string;
  page_id: string;
  notion_block_id: string;
  parent_block_id: string | null;
  type: string;
  content: NotionBlockContent;
  has_children: boolean;
  sort_order: number;
};

function notionToken() {
  return process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || "";
}

export function getNotionRootPageId() {
  return process.env.NOTION_PAGE_ID || parseNotionPageId(process.env.NOTION_PAGE_URL || "");
}

export function parseNotionPageId(value: string) {
  const compact = value.replaceAll("-", "");
  const match = compact.match(/[0-9a-f]{32}/i);
  return match ? match[0] : "";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90) || "page";
}

async function notionFetch<T>(path: string, options: RequestInit = {}) {
  const token = notionToken();

  if (!token) {
    throw new Error("Missing NOTION_TOKEN.");
  }

  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Notion API failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

function plainText(richText: NotionRichText[] = []) {
  return richText.map((item) => item.plain_text).join("").trim();
}

function richTextFromBlock(block: NotionBlock) {
  const typed = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  return typed?.rich_text || [];
}

function titleFromPage(page: Record<string, unknown>) {
  const properties = page.properties as Record<string, { type: string; title?: NotionRichText[] }> | undefined;

  if (!properties) {
    return "Untitled";
  }

  const titleProperty = Object.values(properties).find((property) => property.type === "title");
  return plainText(titleProperty?.title || []) || "Untitled";
}

function blockToMarkdown(block: NotionBlock) {
  const text = plainText(richTextFromBlock(block));

  switch (block.type) {
    case "heading_1":
      return `# ${text}`;
    case "heading_2":
      return `## ${text}`;
    case "heading_3":
      return `### ${text}`;
    case "bulleted_list_item":
      return `- ${text}`;
    case "numbered_list_item":
      return `1. ${text}`;
    case "to_do": {
      const todo = block.to_do as { checked?: boolean } | undefined;
      return `- [${todo?.checked ? "x" : " "}] ${text}`;
    }
    case "quote":
      return `> ${text}`;
    case "divider":
      return "---";
    case "paragraph":
    case "callout":
    case "toggle":
      return text;
    default:
      return text;
  }
}

function blockContent(block: NotionBlock): NotionBlockContent {
  const value = block[block.type] as Record<string, unknown> | undefined;

  if (!value) {
    return {};
  }

  const file = value.file as { url?: string } | undefined;
  const external = value.external as { url?: string } | undefined;
  const title = value.title as string | undefined;

  return {
    richText: (value.rich_text as NotionRichText[] | undefined) || [],
    color: value.color as string | undefined,
    checked: value.checked as boolean | undefined,
    language: value.language as string | undefined,
    url: (value.url as string | undefined) || file?.url || external?.url,
    caption: value.caption as NotionRichText[] | undefined,
    title,
    slug: title ? slugify(title) : undefined
  };
}

async function listChildren(blockId: string) {
  const blocks: NotionBlock[] = [];
  let cursor = "";

  do {
    const query = new URLSearchParams({ page_size: "100" });

    if (cursor) {
      query.set("start_cursor", cursor);
    }

    const data = await notionFetch<{
      results: NotionBlock[];
      has_more: boolean;
      next_cursor: string | null;
    }>(`blocks/${blockId}/children?${query.toString()}`);

    blocks.push(...data.results);
    cursor = data.next_cursor || "";

    if (!data.has_more) {
      break;
    }
  } while (cursor);

  return blocks;
}

async function collectBlocks(blockId: string, parentBlockId: string | null = null, depth = 0) {
  const directChildren = await listChildren(blockId);
  const blocks: Array<{ block: NotionBlock; parentBlockId: string | null; sortOrder: number }> = [];

  for (const [index, block] of directChildren.entries()) {
    blocks.push({ block, parentBlockId, sortOrder: depth * 10000 + index * 10 });

    if (block.has_children) {
      blocks.push(...(await collectBlocks(block.id, block.id, depth + 1)));
    }
  }

  return blocks;
}

async function getPage(pageId: string) {
  return notionFetch<Record<string, unknown>>(`pages/${pageId}`);
}

function pageFromNotion(page: Record<string, unknown>, section: string): ImportedPage {
  const notionPageId = String(page.id || "");
  const title = titleFromPage(page);

  return {
    notionPageId,
    title,
    slug: slugify(title),
    section,
    excerpt: "",
    content: ""
  };
}

async function upsertPage(page: ImportedPage) {
  const response = await supabaseFetch("playbook_pages?on_conflict=notion_page_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      notion_page_id: page.notionPageId,
      title: page.title,
      slug: page.slug,
      section: page.section,
      excerpt: page.excerpt,
      content: page.content,
      status: "published",
      audience: "all",
      imported_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Could not save page: ${await response.text()}`);
  }

  const pages = await parseResponse<StoredPage[]>(response);
  return pages[0];
}

async function replaceBlocks(pageId: string, blocks: Awaited<ReturnType<typeof collectBlocks>>) {
  await supabaseFetch(`playbook_blocks?page_id=eq.${pageId}`, {
    method: "DELETE"
  });

  if (blocks.length === 0) {
    return;
  }

  const response = await supabaseFetch("playbook_blocks", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(
      blocks.map(({ block, parentBlockId, sortOrder }) => ({
        page_id: pageId,
        notion_block_id: block.id,
        parent_block_id: parentBlockId,
        type: block.type,
        content: blockContent(block),
        has_children: block.has_children,
        sort_order: sortOrder
      }))
    )
  });

  if (!response.ok) {
    throw new Error(`Could not save blocks: ${await response.text()}`);
  }
}

async function importPage(pageId: string, section = "Playbook") {
  const notionPage = await getPage(pageId);
  const rawBlocks = await collectBlocks(pageId);
  const childPageBlocks = rawBlocks.filter(({ block }) => block.type === "child_page");
  const page = pageFromNotion(notionPage, section);

  page.excerpt = rawBlocks.map(({ block }) => blockToMarkdown(block)).find(Boolean)?.slice(0, 220) || "";
  page.content = rawBlocks.map(({ block }) => blockToMarkdown(block)).filter(Boolean).join("\n\n");

  const storedPage = await upsertPage(page);
  await replaceBlocks(storedPage.id, rawBlocks);

  const imported = [{ title: page.title, slug: page.slug, blocks: rawBlocks.length }];

  for (const { block } of childPageBlocks) {
    const child = block.child_page as { title?: string } | undefined;
    imported.push(...(await importPage(block.id, child?.title || page.title)));
  }

  return imported;
}

export async function importNotionPlaybook(pageId = getNotionRootPageId()) {
  if (!pageId) {
    throw new Error("Missing NOTION_PAGE_ID or NOTION_PAGE_URL.");
  }

  return importPage(pageId);
}

export async function listBlocks(pageId: string) {
  const response = await supabaseFetch(
    `playbook_blocks?select=*&page_id=eq.${pageId}&order=sort_order.asc`
  );

  if (!response.ok) {
    return [];
  }

  return parseResponse<PlaybookBlock[]>(response);
}
