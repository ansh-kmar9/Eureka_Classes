import { Fragment } from "react";

/**
 * Renders the small slice of markdown that chat replies use: paragraphs, bullet and numbered
 * lists, headings, **bold**, *italic* and `code`. It builds React elements, never raw HTML,
 * so a reply can never inject markup into the page.
 */

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*)/g;

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={index} className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbers"; items: string[] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  const pushItem = (kind: "bullets" | "numbers", item: string) => {
    flush();
    const last = blocks[blocks.length - 1];
    if (last?.kind === kind) last.items.push(item);
    else blocks.push({ kind, items: [item] });
  };

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    const bullet = line.match(/^[*\-•]\s+(.*)$/);
    const number = line.match(/^\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);

    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ kind: "heading", text: heading[1] });
    } else if (bullet) pushItem("bullets", bullet[1]);
    else if (number) pushItem("numbers", number[1]);
    else paragraph.push(line);
  }
  flush();
  return blocks;
}

export function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 leading-relaxed">
      {parse(text).map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <p key={index} className="font-semibold">
                <Inline text={block.text} />
              </p>
            );
          case "bullets":
            return (
              <ul key={index} className="list-disc space-y-1 pl-5">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "numbers":
            return (
              <ol key={index} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={index}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
