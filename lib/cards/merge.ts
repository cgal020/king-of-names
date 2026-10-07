import type { CardDetails } from "@/lib/cards/parse-qr";
import type { Confidence, Person } from "@/lib/types";

type PersonInput = Omit<Person, "id" | "created_at" | "updated_at">;

export type CardField =
  | "full_name"
  | "phone"
  | "company"
  | "role"
  | "email"
  | "website"
  | "linkedin"
  | "line"
  | "digital_card"
  | "address"
  | "birthday";

// Merges details read from a business card into a voice-note draft.
// Printed details beat spoken ones for phone, email, company and role, since
// transcription is weakest on numbers and spellings. The name only switches to
// the card's when the spoken name was missing or uncertain, because people
// sometimes hand over a colleague's card.
export function mergeCard(
  draft: PersonInput,
  card: CardDetails,
  nameConfidence: Confidence,
): { person: PersonInput; fromCard: Set<CardField> } {
  const person: PersonInput = { ...draft, extras: { ...draft.extras } };
  const fromCard = new Set<CardField>();

  const take = (field: CardField, apply: () => void) => {
    apply();
    fromCard.add(field);
  };

  if (card.full_name && (!draft.full_name.trim() || nameConfidence !== "high")) {
    if (card.full_name !== draft.full_name) take("full_name", () => (person.full_name = card.full_name!));
  }
  if (card.phones[0] && card.phones[0] !== draft.phone) take("phone", () => (person.phone = card.phones[0]));
  if (card.company && card.company !== draft.extras.company) take("company", () => (person.extras.company = card.company!));
  if (card.role && card.role !== draft.extras.role) take("role", () => (person.extras.role = card.role!));
  if (card.emails[0] && card.emails[0] !== draft.extras.email) take("email", () => (person.extras.email = card.emails[0]));
  if (card.websites[0] && !draft.extras.website) take("website", () => (person.extras.website = card.websites[0]));
  if (card.linkedin && !draft.extras.linkedin) take("linkedin", () => (person.extras.linkedin = card.linkedin!));
  if (card.line && !draft.extras.line) take("line", () => (person.extras.line = card.line!));
  if (card.digitalCard && !draft.extras.digital_card) {
    take("digital_card", () => (person.extras.digital_card = card.digitalCard!.url));
  }
  if (card.address && !draft.extras.address) take("address", () => (person.extras.address = card.address!));
  if (card.birthday && !draft.birthday_month) {
    take("birthday", () => {
      person.birthday_day = card.birthday!.day;
      person.birthday_month = card.birthday!.month;
      person.birthday_year = card.birthday!.year;
    });
  }
  if (card.notes) person.notes = [draft.notes, card.notes].filter(Boolean).join("\n");

  return { person, fromCard };
}
