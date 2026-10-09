// Your QR codes. Each one opens kingofnames.app/q/<slug>, and the app sends
// the person scanning it on to wherever the code currently points, so a
// printed code never goes out of date and every scan is counted. Shared by
// the editor, the viewer and the /q redirect.
import { z } from "zod";

export const QR_PURPOSES = ["contact", "whatsapp", "linkedin", "instagram", "link"] as const;
export type QrPurpose = (typeof QR_PURPOSES)[number];

export const PURPOSE_META: Record<QrPurpose, { name: string; defaultLabel: string; hint: string }> = {
  contact: { name: "Contact card", defaultLabel: "Save my contact", hint: "Opens a page with your details and a Save contact button." },
  whatsapp: { name: "WhatsApp", defaultLabel: "WhatsApp me", hint: "Opens a WhatsApp chat with you." },
  linkedin: { name: "LinkedIn", defaultLabel: "Connect on LinkedIn", hint: "Opens your LinkedIn profile." },
  instagram: { name: "Instagram", defaultLabel: "Follow me on Instagram", hint: "Opens your Instagram profile." },
  link: { name: "Link", defaultLabel: "Visit my website", hint: "Opens any web address you choose." },
};

const trimmed = (max: number) => z.string().trim().max(max);
// Blank becomes absent. .optional() last, so the key is optional in the output too.
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || undefined)
    .optional();

// A web address someone typed: "example.com/menu" becomes https://example.com/menu.
// Only http(s), and never an address without a proper host.
export function normalizeUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// "+971 55 555 0142" -> "971555550142", the form wa.me wants.
export function whatsappNumber(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

// "linkedin.com/in/cameron-g", a full URL or just "cameron-g".
export function linkedinProfile(input: string): string | null {
  const text = input.trim().replace(/^@/, "");
  const handle = /linkedin\.com\/(in|company)\/([^/?#]+)/i.exec(text);
  if (handle) return `https://www.linkedin.com/${handle[1].toLowerCase()}/${handle[2]}/`;
  return /^[A-Za-z0-9-]{3,100}$/.test(text) ? `https://www.linkedin.com/in/${text}/` : null;
}

// "@cameron", "instagram.com/cameron" or "cameron".
export function instagramHandle(input: string): string | null {
  const text = input.trim();
  const fromUrl = /instagram\.com\/([^/?#]+)/i.exec(text)?.[1];
  const handle = (fromUrl ?? text).replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

const refined = <T extends z.ZodTypeAny>(schema: T, fn: (v: string) => string | null, message: string) =>
  schema.transform((value, ctx) => {
    const out = fn(value as string);
    if (!out) ctx.addIssue({ code: "custom", message });
    return out ?? "";
  });

export const QrDestinationSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("contact"),
    full_name: trimmed(120).min(1, "Add your name."),
    company: optional(120),
    role: optional(120),
    phone: optional(40),
    email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => v || undefined)
      .pipe(z.email("That email doesn't look right.").optional()),
    website: z
      .string()
      .transform((v, ctx) => {
        if (!v.trim()) return undefined;
        const url = normalizeUrl(v);
        if (!url) ctx.addIssue({ code: "custom", message: "That web address doesn't look right." });
        return url ?? undefined;
      })
      .optional(),
  }),
  z.object({
    purpose: z.literal("whatsapp"),
    phone: refined(z.string(), whatsappNumber, "Use your number with the country code, e.g. +971 55 555 0142."),
    message: optional(200),
  }),
  z.object({
    purpose: z.literal("linkedin"),
    url: refined(z.string(), linkedinProfile, "Paste your LinkedIn profile address or name."),
  }),
  z.object({
    purpose: z.literal("instagram"),
    handle: refined(z.string(), instagramHandle, "Use your Instagram name, e.g. @cameron."),
  }),
  z.object({
    purpose: z.literal("link"),
    url: refined(z.string(), normalizeUrl, "That web address doesn't look right."),
  }),
]);
export type QrDestination = z.output<typeof QrDestinationSchema>;

export const QrInputSchema = z.object({
  label: trimmed(40).min(1, "Add the words shown under the code."),
  destination: QrDestinationSchema,
});
export type QrInput = z.output<typeof QrInputSchema>;

export type QrCode = {
  id: string;
  slug: string;
  label: string;
  destination: QrDestination;
  scanCount: number;
  lastScannedAt: string | null;
};

// Where a scan goes. A contact card is a page of its own (null here).
export function destinationUrl(d: QrDestination): string | null {
  switch (d.purpose) {
    case "whatsapp":
      return `https://wa.me/${d.phone}${d.message ? `?text=${encodeURIComponent(d.message)}` : ""}`;
    case "linkedin":
      return d.url;
    case "instagram":
      return `https://www.instagram.com/${d.handle}/`;
    case "link":
      return d.url;
    case "contact":
      return null;
  }
}

// A short summary for lists: "+971 55 555 0142", "@cameron", "example.com/menu".
export function destinationSummary(d: QrDestination): string {
  switch (d.purpose) {
    case "contact":
      return [d.full_name, d.company].filter(Boolean).join(", ");
    case "whatsapp":
      return `+${d.phone}`;
    case "linkedin":
      return d.url.replace(/^https:\/\/www\./, "").replace(/\/$/, "");
    case "instagram":
      return `@${d.handle}`;
    case "link":
      return d.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

// 8 lowercase letters and digits: short enough for a small code, too many
// to guess.
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function newSlug(random: (n: number) => number = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n) {
  return Array.from({ length: 8 }, () => SLUG_ALPHABET[random(SLUG_ALPHABET.length)]).join("");
}
export const isSlug = (s: string) => /^[a-z0-9]{8}$/.test(s);

export const qrUrl = (origin: string, slug: string) => `${origin.replace(/\/$/, "")}/q/${slug}`;
