// Reads a person's details from the link in their card's QR code: a contact
// file is parsed exactly; a digital card page links to its contact file, or
// is read by the AI. Network and AI are passed in, so this is testable.
import { isCardLink } from "@/lib/cards/links";
import { pageToText } from "@/lib/cards/page-text";
import { parseQr, type CardDetails } from "@/lib/cards/parse-qr";

export type LinkReading = { details: CardDetails; from: "contact-file" | "page" } | null;

type Deps = {
  fetch: (url: string) => Promise<{ url: string; contentType: string; body: string }>;
  readPage: (text: string) => Promise<CardDetails | null>;
};

const isVcard = (body: string) => /^﻿?\s*BEGIN:VCARD/i.test(body);

export async function readCardLink(url: string, { fetch, readPage }: Deps): Promise<LinkReading> {
  if (!isCardLink(url)) return null;
  const page = await fetch(url);
  if (isVcard(page.body)) return { details: parseQr(page.body.replace(/^﻿/, "")).details, from: "contact-file" };
  if (!/html/.test(page.contentType) && !/^\s*</.test(page.body)) return null;

  const { text, contactFiles } = pageToText(page.body, page.url);
  // The card's own contact file is exact; use it when the page links to one.
  for (const file of contactFiles.slice(0, 1)) {
    const contact = await fetch(file).catch(() => null);
    if (contact && isVcard(contact.body)) {
      const details = parseQr(contact.body.replace(/^﻿/, "")).details;
      if (details.full_name) return { details, from: "contact-file" };
    }
  }
  // Too little text to hold a card (an empty app shell, say).
  if (text.replace(/^Address: .*$/m, "").replace(/\s+/g, " ").trim().length < 40) return null;
  const details = await readPage(text);
  return details ? { details, from: "page" } : null;
}
