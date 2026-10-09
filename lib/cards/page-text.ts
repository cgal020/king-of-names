// Turns a digital card's web page into plain text the AI can read: the title,
// the descriptive meta tags, structured data, the links (phone, email,
// websites) and the visible text. No HTML parser needed for that. Also finds
// a link to the card's contact file (.vcf), which beats reading the page.

const MAX_TEXT = 24_000;
const MAX_JSON = 6_000;

const META_KEYS = new Set([
  "description",
  "author",
  "og:title",
  "og:description",
  "og:site_name",
  "profile:first_name",
  "profile:last_name",
  "profile:username",
  "twitter:title",
  "twitter:description",
]);

export function decodeEntities(text: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (match, code: string) => {
    const lower = code.toLowerCase();
    if (lower.startsWith("#x")) return safeChar(parseInt(lower.slice(2), 16)) ?? match;
    if (lower.startsWith("#")) return safeChar(parseInt(lower.slice(1), 10)) ?? match;
    return named[lower] ?? match;
  });
}

const safeChar = (code: number) => (Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : null);

function attributes(tag: string) {
  const attrs: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[3] ?? m[4] ?? m[5] ?? "");
  }
  return attrs;
}

const squash = (text: string) => text.replace(/[ \t\f\v ]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();

export function pageToText(html: string, pageUrl: string): { text: string; contactFiles: string[] } {
  const title = squash(decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? ""));

  const meta: string[] = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (META_KEYS.has(key) && a.content?.trim()) meta.push(`${key}: ${squash(a.content)}`);
  }

  // JSON-LD and embedded page data (Next.js and similar keep the card there).
  const data: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const type = attributes(`<x ${m[1]}>`).type ?? "";
    if (!/json/i.test(type)) continue;
    // Long tokens (images, hashes) are noise for reading a card.
    const json = m[2].trim().replace(/"[^"]{300,}"/g, '"…"');
    if (json) data.push(json.slice(0, MAX_JSON));
  }

  const links: string[] = [];
  const contactFiles: string[] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attributes(`<x ${m[1]}>`).href?.trim();
    if (!href) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    const label = squash(decodeEntities(m[2].replace(/<[^>]+>/g, " "))).slice(0, 80);
    if (url.protocol === "tel:" || url.protocol === "mailto:" || url.protocol === "https:" || url.protocol === "http:") {
      const line = `${label ? `${label}: ` : ""}${url.toString()}`;
      if (!links.includes(line)) links.push(line);
    }
    if ((url.protocol === "https:" || url.protocol === "http:") && (/\.vcf$/i.test(url.pathname) || /\bvcard\b/i.test(url.pathname + url.search))) {
      if (!contactFiles.includes(url.toString())) contactFiles.push(url.toString());
    }
  }

  const visible = squash(
    decodeEntities(
      html
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/a|\/span|\/button)\b[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  );

  const parts = [
    `Address: ${pageUrl}`,
    title && `Title: ${title}`,
    meta.length && `Meta:\n${meta.join("\n")}`,
    links.length && `Links:\n${links.slice(0, 60).join("\n")}`,
    visible && `Text:\n${visible}`,
    data.length && `Data:\n${data.join("\n")}`,
  ].filter(Boolean);
  return { text: parts.join("\n\n").slice(0, MAX_TEXT), contactFiles: contactFiles.slice(0, 3) };
}
