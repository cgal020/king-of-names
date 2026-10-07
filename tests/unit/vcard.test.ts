import { describe, expect, it } from "vitest";
import { parseQr } from "@/lib/cards/parse-qr";
import { metNote, toVCard, vcardFileName } from "@/lib/contacts/vcard";
import { getMockPerson } from "@/lib/mock/people";

describe("toVCard", () => {
  const priya = getMockPerson("priya-raman")!;

  it("round-trips the main fields through our own vCard reader", () => {
    const { details } = parseQr(toVCard(priya));
    expect(details).toMatchObject({
      full_name: "Priya Raman",
      company: "Studio Raman",
      role: "Principal",
      phones: ["+971555550193"],
      emails: ["priya@studioraman.example"],
    });
    expect(details.notes).toContain("Met at rooftop at the Marina, Omar's birthday");
    expect(details.notes).toContain("Runs a design studio");
  });

  it("writes birthdays with and without a year", () => {
    const james = getMockPerson("james-oconnell")!;
    const omar = getMockPerson("omar-al-mansouri")!;
    expect(toVCard(james)).toContain("BDAY:1979-07-02");
    expect(toVCard(omar)).toContain("BDAY:--1114");
  });

  it("escapes separators and folds long lines", () => {
    const card = toVCard({ ...priya, notes: "Likes numbers; very direct, no small talk. ".repeat(4) });
    expect(card).toContain("\\;");
    expect(card).toContain("\\,");
    for (const line of card.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("keeps non-Latin names intact", () => {
    const { details } = parseQr(toVCard({ ...priya, full_name: "ศิริพร ศรีสวัสดิ์" }));
    expect(details.full_name).toBe("ศิริพร ศรีสวัสดิ์");
  });

  it("includes tags as categories", () => {
    expect(toVCard(priya)).toContain("CATEGORIES:Partner,Design");
  });
});

describe("metNote and file names", () => {
  it("says where and when you met", () => {
    expect(metNote(getMockPerson("daniel-reyes")!)).toBe(
      "Met at the rooftop bar at Marina Bay Sands, Singapore on 17 May 2024.",
    );
  });

  it("makes a safe file name", () => {
    expect(vcardFileName("Siriporn “Nok” Srisawat")).toBe("Siriporn-Nok-Srisawat.vcf");
  });
});
