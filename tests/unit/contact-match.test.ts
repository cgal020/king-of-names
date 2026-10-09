import { describe, expect, it } from "vitest";
import { describeFill, fillsAnything, matchContact, missingDetails } from "@/lib/contacts/match";
import { parseQr, type CardDetails } from "@/lib/cards/parse-qr";

const contact = (over: Partial<CardDetails>): CardDetails => ({ ...parseQr("").details, notes: null, ...over });
const saved = [
  { id: "daniel", full_name: "Daniel Reyes", phone: "+639175550142", extras: { email: "daniel@reyes.example" }, birthday_month: 3 },
  { id: "sofia", full_name: "Sofia Haddad", phone: null, extras: {}, birthday_month: null },
];

describe("matching imported contacts", () => {
  it("matches the same phone number however it's written", () => {
    expect(matchContact(contact({ full_name: "Dan R", phones: ["0917 555 0142"] }), saved)?.id).toBe("daniel");
  });

  it("matches an email address, any case", () => {
    expect(matchContact(contact({ full_name: "D. Reyes", emails: ["DANIEL@reyes.example"] }), saved)?.id).toBe("daniel");
  });

  it("matches exactly the same name, accents and spacing aside", () => {
    expect(matchContact(contact({ full_name: " sofia  haddad " }), saved)?.id).toBe("sofia");
    // A similar name alone isn't enough to merge two people.
    expect(matchContact(contact({ full_name: "Sofia Hadad" }), saved)).toBeNull();
  });

  it("fills in only what's missing", () => {
    const fill = missingDetails(
      contact({ full_name: "Sofia Haddad", phones: ["+971555550142"], emails: ["sofia@gulf.example"], company: "Gulf Freight", birthday: { day: 2, month: 7, year: null } }),
      saved[1],
    );
    expect(fill).toEqual({
      phone: "+971555550142",
      birthday: { day: 2, month: 7, year: null },
      extras: { email: "sofia@gulf.example", company: "Gulf Freight" },
    });
    expect(describeFill(fill)).toBe("phone, email, work and birthday");
  });

  it("never overwrites a saved detail", () => {
    const fill = missingDetails(contact({ full_name: "Daniel Reyes", phones: ["+971500000000"], emails: ["other@x.example"] }), saved[0]);
    expect(fillsAnything(fill)).toBe(false);
  });
});
