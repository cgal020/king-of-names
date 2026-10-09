// Combines what was read from one card in several ways (its QR code, a photo
// of the card, the page its QR links to), most trusted first. A single value
// comes from the first reading that has it; lists are joined without repeats.
import type { CardDetails } from "@/lib/cards/parse-qr";

const sameUrl = (a: string, b: string) =>
  a.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "").toLowerCase() ===
  b.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "").toLowerCase();

const lastDigits = (phone: string) => phone.replace(/\D/g, "").slice(-9);

export function combineDetails(readings: CardDetails[]): CardDetails {
  const first = <K extends keyof CardDetails>(key: K) => readings.find((r) => r[key])?.[key] ?? null;
  const named = readings.find((r) => r.full_name);

  // The same number written "+971 55…" on the card and "055…" on a page.
  const phones: string[] = [];
  for (const phone of readings.flatMap((r) => r.phones)) {
    if (!phones.some((p) => lastDigits(p) === lastDigits(phone))) phones.push(phone);
  }
  const emails = [...new Set(readings.flatMap((r) => r.emails.map((e) => e.toLowerCase())))];
  const digitalCard = first("digitalCard") as CardDetails["digitalCard"];
  const websites: string[] = [];
  for (const site of readings.flatMap((r) => r.websites)) {
    if (digitalCard && sameUrl(site, digitalCard.url)) continue;
    if (!websites.some((w) => sameUrl(w, site))) websites.push(site);
  }
  const notes = [...new Set(readings.flatMap((r) => r.notes?.split("\n") ?? []).filter(Boolean))];

  return {
    full_name: named?.full_name ?? null,
    company: first("company") as string | null,
    role: first("role") as string | null,
    phones,
    emails,
    websites,
    linkedin: first("linkedin") as string | null,
    line: first("line") as string | null,
    digitalCard,
    address: first("address") as string | null,
    notes: notes.length ? notes.join("\n") : null,
    birthday: first("birthday") as CardDetails["birthday"],
    ...(named?.nameIsGuess ? { nameIsGuess: true } : {}),
  };
}
