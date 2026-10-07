import { describe, expect, it } from "vitest";
import { mergeCard } from "@/lib/cards/merge";
import type { CardDetails } from "@/lib/cards/parse-qr";
import { mockDraft } from "@/lib/mock/people";

const card = (overrides: Partial<CardDetails> = {}): CardDetails => ({
  full_name: "Sofia Haddad",
  company: "Gulf Freight Partners",
  role: "Head of Partnerships",
  phones: ["+971555550142"],
  emails: ["sofia@gulffreight.example"],
  websites: ["https://gulffreight.example"],
  linkedin: null,
  address: "Jebel Ali Free Zone, Dubai",
  notes: null,
  birthday: null,
  ...overrides,
});

describe("mergeCard", () => {
  const draft = mockDraft.person;

  it("prefers printed details over spoken ones and fills the gaps", () => {
    const { person, fromCard } = mergeCard(draft, card({ phones: ["+97145550000"] }), "high");
    expect(person.phone).toBe("+97145550000");
    expect(person.extras).toMatchObject({
      company: "Gulf Freight Partners",
      role: "Head of Partnerships",
      email: "sofia@gulffreight.example",
      website: "https://gulffreight.example",
      address: "Jebel Ali Free Zone, Dubai",
    });
    expect([...fromCard].sort()).toEqual(["address", "company", "email", "phone", "role", "website"]);
  });

  it("does not mark fields that already matched", () => {
    const { fromCard } = mergeCard(draft, card(), "high");
    expect(fromCard.has("phone")).toBe(false);
  });

  it("keeps a confident spoken name even when the card differs", () => {
    const { person } = mergeCard(draft, card({ full_name: "Omar Al-Mansouri" }), "high");
    expect(person.full_name).toBe("Sofia Haddad");
  });

  it("takes the card's name when the spoken one was uncertain or missing", () => {
    expect(mergeCard(draft, card({ full_name: "Sofía Haddad" }), "medium").person.full_name).toBe("Sofía Haddad");
    expect(mergeCard({ ...draft, full_name: "" }, card(), "high").person.full_name).toBe("Sofia Haddad");
  });

  it("keeps a spoken birthday and appends card notes", () => {
    const { person } = mergeCard(draft, card({ birthday: { day: 1, month: 1, year: 1980 }, notes: "Ask for the Jebel Ali office" }), "high");
    expect(person.birthday_month).toBe(3);
    expect(person.notes).toBe("Runs partnerships for a freight company.\nAsk for the Jebel Ali office");
  });

  it("does not modify the original draft", () => {
    mergeCard(draft, card({ phones: ["+1"] }), "high");
    expect(draft.phone).toBe("+971555550142");
    expect(draft.extras.company).toBeUndefined();
  });
});
