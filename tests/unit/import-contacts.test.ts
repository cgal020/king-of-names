import { describe, expect, it } from "vitest";
import { contactsFromPicker, contactsFromVcf, splitVcards } from "@/lib/contacts/import";
import { toVCard } from "@/lib/contacts/vcard";
import { getMockPerson } from "@/lib/mock/people";

describe("contactsFromVcf", () => {
  it("reads every card in a multi-contact export", () => {
    const file = [getMockPerson("priya-raman")!, getMockPerson("omar-al-mansouri")!].map((p) => toVCard(p)).join("");
    expect(splitVcards(file)).toHaveLength(2);
    expect(contactsFromVcf(file).map((c) => c.full_name)).toEqual(["Priya Raman", "Omar Al-Mansouri"]);
  });

  it("skips empty cards and ignores text outside cards", () => {
    const file = "junk\nBEGIN:VCARD\nVERSION:3.0\nEND:VCARD\nBEGIN:VCARD\nFN:Kenji Watanabe\nEND:VCARD\n";
    expect(contactsFromVcf(file).map((c) => c.full_name)).toEqual(["Kenji Watanabe"]);
  });
});

describe("contactsFromPicker", () => {
  it("normalises numbers, removes duplicates and drops empty entries", () => {
    const contacts = contactsFromPicker([
      { name: ["Nok Srisawat"], tel: ["+66 81 555 0147", "+66815550147"], email: ["nok@example.com "] },
      { name: [""], tel: [], email: [] },
    ]);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({ full_name: "Nok Srisawat", phones: ["+66815550147"], emails: ["nok@example.com"] });
  });
});
