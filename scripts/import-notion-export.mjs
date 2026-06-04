import fs from "node:fs/promises";
import path from "node:path";

const root = process.argv[2];

if (!root) {
  console.error("Usage: npm run import:notion -- /path/to/notion-export-folder");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function titleFromMarkdown(fileName, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fileName.replace(/\.md$/i, "").replace(/\s+[a-f0-9]{32}$/i, "");
}

function excerptFromContent(content) {
  return content
    .replace(/^#\s+.+$/m, "")
    .replace(/[#*_>`-]/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 220) || "";
}

async function upsertPage(page) {
  const response = await fetch(`${supabaseUrl}/rest/v1/playbook_pages?on_conflict=slug`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(page)
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
}

const markdownFiles = await walk(path.resolve(root));
let sortOrder = 10;

for (const file of markdownFiles) {
  const content = await fs.readFile(file, "utf8");
  const relativePath = path.relative(path.resolve(root), file);
  const title = titleFromMarkdown(path.basename(file), content);
  const parent = path.dirname(relativePath);
  const section = parent === "." ? "Playbook" : parent.split(path.sep)[0];

  await upsertPage({
    title,
    slug: slugify(relativePath),
    section,
    excerpt: excerptFromContent(content),
    content,
    status: "draft",
    audience: "internal",
    sort_order: sortOrder,
    notion_path: relativePath
  });

  sortOrder += 10;
  console.log(`Imported ${relativePath}`);
}

console.log(`Done. Imported ${markdownFiles.length} Markdown pages as drafts.`);
