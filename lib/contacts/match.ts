// Matching imported contacts against the people already saved, so an import
// never adds someone twice. A contact is the same person when it shares a
// phone number (the last nine digits, so +971 55… and 055… agree), an email
// address, or exactly the same name. A match only fills in what's missing;
// nothing already saved is overwritten.
import type { CardDetails } from "@/lib/cards/parse-qr";
import type { Person } from "@/lib/types";

const lastDigits = (phone: string | null | undefined) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-9) : null;
};

const sameText = (a: string | null | undefined, b: string | null | undefined) =>
  Boolean(a && b) &&
  a!.normalize("NFKD").replace(/\p{M}/gu, "").trim().toLowerCase().replace(/\s+/g, " ") ===
    b!.normalize("NFKD").replace(/\p{M}/gu, "").trim().toLowerCase().replace(/\s+/g, " ");

export function matchContact<P extends Pick<Person, "id" | "full_name" | "phone" | "extras">>(contact: CardDetails, people: P[]): P | null {
  const phones = contact.phones.map(lastDigits).filter(Boolean);
  const emails = contact.emails.map((e) => e.trim().toLowerCase());
  return (
    people.find((p) => phones.includes(lastDigits(p.phone))) ??
    people.find((p) => p.extras.email && emails.includes(p.extras.email.trim().toLowerCase())) ??
    people.find((p) => sameText(p.full_name, contact.full_name)) ??
    null
  );
}

// What the contact would add to a saved person: only empty fields.
export type Fill = {
  phone?: string;
  birthday?: { day: number | null; month: number; year: number | null };
  extras: Record<string, string>;
};

const EXTRAS: [keyof CardDetails, string][] = [
  ["company", "company"],
  ["role", "role"],
  ["linkedin", "linkedin"],
  ["line", "line"],
  ["address", "address"],
];

export function missingDetails(contact: CardDetails, person: Pick<Person, "phone" | "extras" | "birthday_month">): Fill {
  const fill: Fill = { extras: {} };
  if (!person.phone && contact.phones[0]) fill.phone = contact.phones[0];
  if (!person.birthday_month && contact.birthday) fill.birthday = contact.birthday;
  if (!person.extras.email && contact.emails[0]) fill.extras.email = contact.emails[0];
  if (!person.extras.website && contact.websites[0]) fill.extras.website = contact.websites[0];
  for (const [from, key] of EXTRAS) {
    const value = contact[from];
    if (!person.extras[key] && typeof value === "string" && value.trim()) fill.extras[key] = value.trim();
  }
  return fill;
}

export const fillsAnything = (fill: Fill) => Boolean(fill.phone || fill.birthday || Object.keys(fill.extras).length);

// "phone and email", for the preview.
export function describeFill(fill: Fill) {
  const names = [
    fill.phone && "phone",
    fill.extras.email && "email",
    (fill.extras.company || fill.extras.role) && "work",
    fill.birthday && "birthday",
    (fill.extras.website || fill.extras.linkedin || fill.extras.line) && "links",
    fill.extras.address && "address",
  ].filter((n): n is string => Boolean(n));
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}
