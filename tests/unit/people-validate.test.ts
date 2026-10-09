import { describe, expect, it } from "vitest";
import { localInputToIso } from "@/lib/format";
import { cityOptions } from "@/lib/geo/cities";
import { isPersonId, PersonInputSchema } from "@/lib/people/validate";

const base = {
  full_name: "  Priya Raman ",
  met_at: "2026-09-28T19:30:00+04:00",
  met_timezone: "Asia/Dubai",
  lat: 25.08,
  lng: 55.14,
  location_accuracy_m: 12,
  place_name: "Dubai Marina",
  city: "Dubai",
  region: null,
  country: "United Arab Emirates",
  where_met_text: "",
  phone: null,
  birthday_month: null,
  birthday_day: null,
  birthday_year: null,
  notes: "Design studio ",
  follow_up_note: null,
  follow_up_date: null,
  extras: { company: " Studio Raman ", role: "" },
  relationship: "business",
  tags: ["partner", "Partner", " design  intro "],
};

describe("PersonInputSchema", () => {
  it("tidies what was typed: trims, empties to null, one copy of each tag", () => {
    const p = PersonInputSchema.parse(base);
    expect(p.full_name).toBe("Priya Raman");
    expect(p.where_met_text).toBeNull();
    expect(p.notes).toBe("Design studio");
    expect(p.extras).toEqual({ company: "Studio Raman" });
    expect(p.tags).toEqual(["Partner", "Design intro"]);
  });

  it("needs a name, both coordinates together, and a real birthday", () => {
    expect(PersonInputSchema.safeParse({ ...base, full_name: "  " }).success).toBe(false);
    expect(PersonInputSchema.safeParse({ ...base, lng: null }).success).toBe(false);
    expect(PersonInputSchema.safeParse({ ...base, birthday_month: 2, birthday_day: 30 }).success).toBe(false);
    expect(PersonInputSchema.safeParse({ ...base, birthday_month: 2, birthday_day: 29 }).success).toBe(true);
  });

  it("refuses a meeting in the future and an unknown time zone", () => {
    expect(PersonInputSchema.safeParse({ ...base, met_at: "2999-01-01T00:00:00Z" }).success).toBe(false);
    expect(PersonInputSchema.safeParse({ ...base, met_timezone: "Mars/Olympus" }).success).toBe(false);
  });

  it("only treats UUIDs as saved people", () => {
    expect(isPersonId("2f1c6a3e-9b1d-4c2e-8f4a-0b2c3d4e5f60")).toBe(true);
    expect(isPersonId("priya-raman")).toBe(false);
  });
});

describe("localInputToIso", () => {
  it("reads the time in the zone where they met", () => {
    expect(localInputToIso("2026-10-06T21:42", "Asia/Dubai")).toBe("2026-10-06T17:42:00.000Z");
    expect(localInputToIso("2026-10-06T21:42", "Asia/Bangkok")).toBe("2026-10-06T14:42:00.000Z");
  });

  it("follows daylight saving (Sydney in October and in June)", () => {
    expect(localInputToIso("2026-10-20T09:00", "Australia/Sydney")).toBe("2026-10-19T22:00:00.000Z");
    expect(localInputToIso("2026-06-20T09:00", "Australia/Sydney")).toBe("2026-06-19T23:00:00.000Z");
  });
});

describe("cityOptions", () => {
  it("puts your own cities first, centred on your pins, then the rest", () => {
    const options = cityOptions([
      { city: "Phuket", country: "Thailand", lat: 7.9, lng: 98.4 },
      { city: "Phuket", country: "Thailand", lat: 7.8, lng: 98.3 },
      { city: "Riga", country: "Latvia", lat: 56.95, lng: 24.1 },
    ]);
    expect(options[0]).toMatchObject({ city: "Phuket", lat: 7.85, lng: 98.35 });
    expect(options[1].city).toBe("Riga");
    expect(options.filter((c) => c.city === "Phuket")).toHaveLength(1);
    expect(options.some((c) => c.city === "Dubai")).toBe(true);
  });
});
