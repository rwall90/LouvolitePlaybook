function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

export function MarkdownView({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const html = blocks
    .map((block) => {
      if (block.startsWith("### ")) {
        return `<h3>${inlineMarkdown(block.slice(4))}</h3>`;
      }

      if (block.startsWith("## ")) {
        return `<h2>${inlineMarkdown(block.slice(3))}</h2>`;
      }

      if (block.startsWith("# ")) {
        return `<h1>${inlineMarkdown(block.slice(2))}</h1>`;
      }

      if (block.startsWith("- ")) {
        const items = block
          .split("\n")
          .map((line) => `<li>${inlineMarkdown(line.replace(/^- /, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      if (/^\d+\. /.test(block)) {
        const items = block
          .split("\n")
          .map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\. /, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${inlineMarkdown(block.replaceAll("\n", "<br />"))}</p>`;
    })
    .join("");

  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
