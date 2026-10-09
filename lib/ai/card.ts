// Business-card reading: the schemas the model fills from a card photo or a
// digital card's page, and the mapping to the same CardDetails a QR code
// produces. No network here, so it's testable.
import { z } from "zod";
import { normalizePhone, type CardDetails } from "@/lib/cards/parse-qr";

const text = z.string().nullable();

export const CardSchema = z.object({
  full_name: text,
  company: text,
  role: text,
  phones: z.array(z.string()),
  emails: z.array(z.string()),
  websites: z.array(z.string()),
  linkedin: text,
  address: text,
  other_details: z.array(z.object({ label: z.string(), value: z.string() })),
});

export type CardReading = z.infer<typeof CardSchema>;

const trim = (v: string | null) => v?.trim() || null;

export function cardReadingToDetails(raw: unknown): CardDetails {
  const c = CardSchema.parse(raw);
  const phones = [...new Set(c.phones.map(normalizePhone).filter((p) => p.replace("+", "").length >= 6))];
  const emails = [...new Set(c.emails.map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
  const websites = [...new Set(c.websites.map((w) => w.trim()).filter(Boolean))].map((w) =>
    /^https?:\/\//i.test(w) ? w : `https://${w}`,
  );
  const other = c.other_details
    .filter((d) => d.label.trim() && d.value.trim())
    .map((d) => `${d.label.trim()}: ${d.value.trim()}`);
  return {
    full_name: trim(c.full_name),
    company: trim(c.company),
    role: trim(c.role),
    phones,
    emails,
    websites,
    linkedin: trim(c.linkedin),
    line: null,
    digitalCard: null,
    address: trim(c.address),
    notes: other.length ? other.join("\n") : null,
    birthday: null,
  };
}

// A digital card's page says what kind of page it is, so a company homepage or
// a sign-in wall can't fill in someone's details.
export const LinkPageSchema = CardSchema.extend({
  page_kind: z
    .enum(["personal_card", "company_site", "other"])
    .describe("personal_card: one person's digital business card or profile page. company_site: a company's own site. other: anything else, including errors and sign-in pages."),
});

export function linkReadingToDetails(raw: unknown): CardDetails | null {
  const reading = LinkPageSchema.parse(raw);
  if (reading.page_kind === "other") return null;
  const details = cardReadingToDetails(reading);
  if (reading.page_kind === "personal_card") return details;
  // A company site: only the company name, never its switchboard or inbox.
  return details.company ? { ...cardReadingToDetails({ ...EMPTY_READING, company: details.company }) } : null;
}

const EMPTY_READING: CardReading = {
  full_name: null,
  company: null,
  role: null,
  phones: [],
  emails: [],
  websites: [],
  linkedin: null,
  address: null,
  other_details: [],
};
