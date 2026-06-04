import type { PlaybookBlock, NotionBlockContent } from "@/lib/notion";
import type { ReactNode } from "react";

type RichTextItem = NonNullable<NotionBlockContent["richText"]>[number];

function textContent(richText: RichTextItem[] = []) {
  return richText.map((item) => item.plain_text).join("");
}

function RichText({ richText }: { richText?: RichTextItem[] }) {
  return (
    <>
      {(richText || []).map((item, index) => {
        let node: ReactNode = item.plain_text;
        const annotations = item.annotations || {};

        if (annotations.code) {
          node = <code>{node}</code>;
        }

        if (annotations.bold) {
          node = <strong>{node}</strong>;
        }

        if (annotations.italic) {
          node = <em>{node}</em>;
        }

        if (annotations.underline) {
          node = <u>{node}</u>;
        }

        if (annotations.strikethrough) {
          node = <s>{node}</s>;
        }

        if (item.href) {
          node = (
            <a href={item.href} rel="noreferrer" target={item.href.startsWith("/") ? undefined : "_blank"}>
              {node}
            </a>
          );
        }

        return <span key={`${item.plain_text}-${index}`}>{node}</span>;
      })}
    </>
  );
}

function blocksByParent(blocks: PlaybookBlock[]) {
  return blocks.reduce<Record<string, PlaybookBlock[]>>((groups, block) => {
    const key = block.parent_block_id || "root";
    groups[key] = groups[key] || [];
    groups[key].push(block);
    return groups;
  }, {});
}

function Children({
  parentId,
  groups
}: {
  parentId: string;
  groups: Record<string, PlaybookBlock[]>;
}) {
  const children = groups[parentId] || [];

  if (children.length === 0) {
    return null;
  }

  return (
    <div className="notion-children">
      {children.map((child) => (
        <Block block={child} groups={groups} key={child.id} />
      ))}
    </div>
  );
}

function Block({
  block,
  groups
}: {
  block: PlaybookBlock;
  groups: Record<string, PlaybookBlock[]>;
}) {
  const content = block.content || {};
  const richText = content.richText || [];

  switch (block.type) {
    case "heading_1":
      return <h1><RichText richText={richText} /></h1>;
    case "heading_2":
      return <h2><RichText richText={richText} /></h2>;
    case "heading_3":
      return <h3><RichText richText={richText} /></h3>;
    case "paragraph":
      return textContent(richText) ? <p><RichText richText={richText} /></p> : <div className="notion-spacer" />;
    case "bulleted_list_item":
      return (
        <div className="notion-list-item">
          <span aria-hidden="true">•</span>
          <div>
            <RichText richText={richText} />
            <Children parentId={block.notion_block_id} groups={groups} />
          </div>
        </div>
      );
    case "numbered_list_item":
      return (
        <div className="notion-list-item numbered">
          <span aria-hidden="true">#</span>
          <div>
            <RichText richText={richText} />
            <Children parentId={block.notion_block_id} groups={groups} />
          </div>
        </div>
      );
    case "to_do":
      return (
        <label className="notion-todo">
          <input checked={Boolean(content.checked)} readOnly type="checkbox" />
          <span><RichText richText={richText} /></span>
        </label>
      );
    case "toggle":
      return (
        <details className="notion-toggle">
          <summary><RichText richText={richText} /></summary>
          <Children parentId={block.notion_block_id} groups={groups} />
        </details>
      );
    case "callout":
      return (
        <section className={`notion-callout notion-color-${content.color || "default"}`}>
          <div className="callout-icon">Note</div>
          <div className="callout-content">
            <p><RichText richText={richText} /></p>
            <Children parentId={block.notion_block_id} groups={groups} />
          </div>
        </section>
      );
    case "quote":
      return <blockquote><RichText richText={richText} /></blockquote>;
    case "divider":
      return <hr />;
    case "image":
      return content.url ? (
        <figure>
          <img alt={textContent(content.caption || []) || "Notion image"} src={content.url} />
          {content.caption?.length ? <figcaption><RichText richText={content.caption} /></figcaption> : null}
        </figure>
      ) : null;
    case "code":
      return (
        <pre>
          <code>{textContent(richText)}</code>
        </pre>
      );
    case "child_page":
      return (
        <a className="notion-child-page" href={`/wiki/${content.slug || block.notion_block_id.replaceAll("-", "")}`}>
          {content.title || textContent(richText) || "Child page"}
        </a>
      );
    default:
      return textContent(richText) ? <p><RichText richText={richText} /></p> : null;
  }
}

export function NotionBlocks({ blocks }: { blocks: PlaybookBlock[] }) {
  const groups = blocksByParent(blocks);
  const rootBlocks = groups.root || [];

  return (
    <div className="article-body notion-body">
      {rootBlocks.map((block) => (
        <Block block={block} groups={groups} key={block.id} />
      ))}
    </div>
  );
}
