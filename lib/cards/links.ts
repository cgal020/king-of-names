// What a link from a scanned QR code can tell us. The server may open it only
// when it is the person's own card: a digital business card page or a
// contact file. Never a company website or a social network, so nobody is
// looked up (the privacy pledge's "no enrichment"). No network here.
import { digitalCardService, type CardDetails } from "@/lib/cards/parse-qr";

// http(s) on the default port, a real host name (not an IP address or a
// local name) and no user name or password in it.
export function safeWebUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.startsWith("[") || /^[\d.]+$/.test(host)) return null;
  if (/\.(local|localhost|internal|lan|home|arpa|test|invalid)\.?$/.test(host)) return null;
  url.hash = "";
  return url;
}

// A contact file (.vcf) the card links to directly.
const isContactFile = (url: URL) => /\.vcf$/i.test(url.pathname);

// The link to read for this card's details, if it has one we may open.
export function cardLink(details: CardDetails): string | null {
  for (const candidate of [details.digitalCard?.url, ...details.websites]) {
    const url = candidate ? safeWebUrl(candidate) : null;
    if (url && (digitalCardService(url.hostname.replace(/^www\./, "")) || isContactFile(url))) return url.toString();
  }
  return null;
}

export const isCardLink = (input: string) => {
  const url = safeWebUrl(input);
  return Boolean(url && (digitalCardService(url.hostname.replace(/^www\./, "")) || isContactFile(url)));
};

// LinkedIn pages can't be read without signing in, but the address often
// spells the name: linkedin.com/in/sofia-haddad-4b2a1b23 is "Sofia Haddad".
// A guess, so it is marked for checking.
export function nameFromLinkedin(url: string): string | null {
  const slug = /linkedin\.com\/in\/([^/?#]+)/i.exec(url)?.[1];
  if (!slug) return null;
  let parts: string[];
  try {
    parts = decodeURIComponent(slug).split(/[-_]+/).filter(Boolean);
  } catch {
    return null;
  }
  // LinkedIn adds a number or code to common names.
  while (parts.length && /\d/.test(parts[parts.length - 1])) parts.pop();
  if (parts.length < 2 || parts.length > 4) return null;
  if (!parts.every((p) => /^\p{L}+$/u.test(p))) return null;
  // A middle initial is fine; a one-letter first or last name is not a name.
  if (parts[0].length < 2 || parts[parts.length - 1].length < 2) return null;
  return parts.map((p) => p[0].toLocaleUpperCase() + p.slice(1)).join(" ");
}
