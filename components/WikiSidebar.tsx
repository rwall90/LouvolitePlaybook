"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlaybookPage } from "@/lib/supabase";

export function WikiSidebar({
  pages,
  activeSlug
}: {
  pages: PlaybookPage[];
  activeSlug: string;
}) {
  const [query, setQuery] = useState("");
  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return pages;
    }

    return pages.filter((page) =>
      [page.title, page.section, page.excerpt].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [pages, query]);

  return (
    <aside className="sidebar panel">
      <label className="search">
        Search
        <input
          type="search"
          placeholder="Search pages"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <nav className="page-list" aria-label="Wiki pages">
        {filteredPages.map((page) => (
          <Link
            className={`page-link ${page.slug === activeSlug ? "active" : ""}`}
            href={`/wiki/${page.slug}`}
            key={page.id}
          >
            <span>{page.section}</span>
            {page.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
