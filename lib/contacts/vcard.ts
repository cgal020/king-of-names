// Builds a vCard 3.0 for "Save to contacts". 3.0 is what iOS and Android
// import most reliably. The NOTE carries where and when you met.
import { formatMetDate } from "@/lib/format";
import type { Person } from "@/lib/types";

type VCardPerson = Pick<
  Person,
  | "full_name"
  | "phone"
  | "extras"
  | "birthday_day"
  | "birthday_month"
  | "birthday_year"
  | "where_met_text"
  | "place_name"
  | "city"
  | "met_at"
  | "met_timezone"
  | "notes"
  | "tags"
>;

// Escapes text values per RFC 2426.
function esc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// Folds lines longer than 75 bytes, as the spec requires.
function fold(line: string) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (bytes.encode(current + char).length > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

// "Siriporn “Nok” Srisawat" -> family "Srisawat", given "Siriporn “Nok”".
function splitName(fullName: string) {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return { family: "", given: words[0] };
  return { family: words.at(-1)!, given: words.slice(0, -1).join(" ") };
}

export function metNote(p: Pick<VCardPerson, "where_met_text" | "place_name" | "city" | "met_at" | "met_timezone">) {
  const where = p.where_met_text ?? [p.place_name, p.city].filter(Boolean).join(", ");
  const place = where ? ` at ${where}${p.city && !where.includes(p.city) ? `, ${p.city}` : ""}` : "";
  return `Met${place} on ${formatMetDate(p.met_at, p.met_timezone)}.`;
}

export function toVCard(p: VCardPerson, photoJpegBase64?: string) {
  const { family, given } = splitName(p.full_name);
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${esc(family)};${esc(given)};;;`, `FN:${esc(p.full_name)}`];

  if (p.extras.company) lines.push(`ORG:${esc(p.extras.company)}`);
  if (p.extras.role) lines.push(`TITLE:${esc(p.extras.role)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${p.phone}`);
  if (p.extras.email) lines.push(`EMAIL;TYPE=INTERNET:${p.extras.email}`);
  for (const url of [p.extras.website, p.extras.digital_card, p.extras.line]) {
    if (url) lines.push(`URL:${url}`);
  }
  if (p.extras.linkedin) lines.push(`X-SOCIALPROFILE;type=linkedin:${p.extras.linkedin}`);
  if (p.extras.address) lines.push(`ADR;TYPE=WORK:;;${esc(p.extras.address)};;;;`);
  if (p.birthday_month && p.birthday_day) {
    const mm = String(p.birthday_month).padStart(2, "0");
    const dd = String(p.birthday_day).padStart(2, "0");
    lines.push(`BDAY:${p.birthday_year ? `${p.birthday_year}-${mm}-${dd}` : `--${mm}${dd}`}`);
  }
  if (p.tags.length) lines.push(`CATEGORIES:${p.tags.map(esc).join(",")}`);
  lines.push(`NOTE:${esc([metNote(p), p.notes].filter(Boolean).join("\n"))}`);
  if (photoJpegBase64) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoJpegBase64}`);
  lines.push("END:VCARD");

  return lines.map(fold).join("\r\n") + "\r\n";
}

// Safe file name for the .vcf.
export function vcardFileName(fullName: string) {
  return `${fullName.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "contact"}.vcf`;
}
