import { describe, expect, it } from "vitest";
import { normalizePhone, parseQr } from "@/lib/cards/parse-qr";

describe("parseQr: vCard", () => {
  it("reads a typical digital business card", () => {
    const { kind, details } = parseQr(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Raman;Priya;;;",
        "FN:Priya Raman",
        "ORG:Studio Raman;Interiors",
        "TITLE:Principal",
        "TEL;TYPE=CELL:+971 55 555 0193",
        "TEL;TYPE=WORK:+971 4 555 0100",
        "EMAIL;TYPE=INTERNET:priya@studioraman.example",
        "URL:https://studioraman.example",
        "URL:https://www.linkedin.com/in/priya-raman-example",
        "ADR;TYPE=WORK:;;Building 7\\, Al Quoz;Dubai;;;United Arab Emirates",
        "END:VCARD",
      ].join("\r\n"),
    );
    expect(kind).toBe("vcard");
    expect(details).toMatchObject({
      full_name: "Priya Raman",
      company: "Studio Raman",
      role: "Principal",
      phones: ["+971555550193", "+97145550100"],
      emails: ["priya@studioraman.example"],
      websites: ["https://studioraman.example"],
      linkedin: "https://www.linkedin.com/in/priya-raman-example",
      address: "Building 7, Al Quoz, Dubai, United Arab Emirates",
    });
  });

  it("builds the name from N when FN is missing and unfolds long lines", () => {
    const { details } = parseQr("BEGIN:VCARD\nVERSION:3.0\nN:Watanabe;Kenji\nNOTE:Yacht charters in Chalong\n , golf on Saturdays\nEND:VCARD");
    expect(details.full_name).toBe("Kenji Watanabe");
    expect(details.notes).toBe("Yacht charters in Chalong, golf on Saturdays");
  });

  it("decodes quoted-printable UTF-8 names", () => {
    const { details } = parseQr(
      "BEGIN:VCARD\nVERSION:2.1\nFN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Jos=C3=A9 Garc=C3=ADa\nEND:VCARD",
    );
    expect(details.full_name).toBe("José García");
  });

  it("keeps non-Latin names intact", () => {
    const { details } = parseQr("BEGIN:VCARD\nVERSION:4.0\nFN:ศิริพร ศรีสวัสดิ์\nTEL:tel:+66815550147\nEND:VCARD");
    expect(details.full_name).toBe("ศิริพร ศรีสวัสดิ์");
    expect(details.phones).toEqual(["+66815550147"]);
  });

  it("reads birthdays with and without a year", () => {
    expect(parseQr("BEGIN:VCARD\nFN:A\nBDAY:1979-07-02\nEND:VCARD").details.birthday).toEqual({ day: 2, month: 7, year: 1979 });
    expect(parseQr("BEGIN:VCARD\nFN:A\nBDAY:--0303\nEND:VCARD").details.birthday).toEqual({ day: 3, month: 3, year: null });
    expect(parseQr("BEGIN:VCARD\nFN:A\nBDAY:1979-13-40\nEND:VCARD").details.birthday).toBeNull();
  });

  it("picks up LinkedIn from Apple's social profile field", () => {
    const { details } = parseQr(
      "BEGIN:VCARD\nFN:A\nitem1.X-SOCIALPROFILE;type=linkedin:https://linkedin.com/in/a-example\nEND:VCARD",
    );
    expect(details.linkedin).toBe("https://linkedin.com/in/a-example");
  });
});

describe("parseQr: other formats", () => {
  it("reads MECARD", () => {
    const { kind, details } = parseQr("MECARD:N:Hadad,Sofia;TEL:+971555550142;EMAIL:sofia@freight.example;URL:https\\://freight.example;;");
    expect(kind).toBe("mecard");
    expect(details).toMatchObject({
      full_name: "Sofia Hadad",
      phones: ["+971555550142"],
      emails: ["sofia@freight.example"],
      websites: ["https://freight.example"],
    });
  });

  it("files LinkedIn and digital-card links without fetching them", () => {
    expect(parseQr("https://www.linkedin.com/in/someone").details.linkedin).toBe("https://www.linkedin.com/in/someone");
    const card = parseQr("https://blinq.me/abc123");
    expect(card.kind).toBe("link");
    expect(card.details.websites).toEqual(["https://blinq.me/abc123"]);
  });

  it("turns a WhatsApp link into a phone number", () => {
    expect(parseQr("https://wa.me/971555550142").details.phones).toEqual(["+971555550142"]);
  });

  it("reads tel:, mailto:, bare numbers and bare emails", () => {
    expect(parseQr("tel:+61 412 555 018").details.phones).toEqual(["+61412555018"]);
    expect(parseQr("mailto:james@example.com?subject=Hi").details.emails).toEqual(["james@example.com"]);
    expect(parseQr("0917 555 0142").details.phones).toEqual(["09175550142"]);
    expect(parseQr("hello@example.com").kind).toBe("email");
  });

  it("keeps anything else as a note", () => {
    const { kind, details } = parseQr("Ask for Omar at the front desk");
    expect(kind).toBe("text");
    expect(details.notes).toBe("Ask for Omar at the front desk");
  });
});

describe("normalizePhone", () => {
  it("keeps digits and a leading plus without guessing a country code", () => {
    expect(normalizePhone("+971 (55) 555-0193")).toBe("+971555550193");
    expect(normalizePhone("0917 555 0142")).toBe("09175550142");
  });
});
