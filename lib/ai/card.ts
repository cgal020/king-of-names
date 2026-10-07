// Business-card reading: the schema the vision model fills, and the mapping to
// the same CardDetails a QR code produces. No network here, so it's testable.
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
