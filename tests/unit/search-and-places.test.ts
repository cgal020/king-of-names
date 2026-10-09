import { describe, expect, it } from "vitest";
import { parseReverseGeocode } from "@/lib/geo/mapbox";
import { commonPlaceName, placeAliases } from "@/lib/geo/places";
import { matchesSearch, searchEntry } from "@/lib/people/search";
import { mockPeople } from "@/lib/mock/people";
import type { Encounter, Person } from "@/lib/types";

describe("place names as people say them", () => {
  it("uses the common name for official areas", () => {
    expect(commonPlaceName("Marsa Dubai")).toBe("Dubai Marina");
    expect(commonPlaceName("Za'abeel Second")).toBe("DIFC");
    expect(commonPlaceName("Bayfront Subzone")).toBe("Marina Bay");
    expect(commonPlaceName("Tanjong Pagar Subzone")).toBe("Tanjong Pagar");
    expect(commonPlaceName("Barangay 655")).toBe("Intramuros");
    expect(commonPlaceName("Sukhumvit")).toBe("Sukhumvit");
  });

  it("drops a numbered barangay so the street is used instead", () => {
    expect(commonPlaceName("Barangay 42")).toBeNull();
    const place = parseReverseGeocode({
      features: [
        {
          properties: {
            feature_type: "address",
            context: { neighborhood: { name: "Barangay 42" }, street: { name: "Roxas Boulevard" }, place: { name: "Manila" } },
          },
        },
      ],
    });
    expect(place?.place_name).toBe("Roxas Boulevard");
  });

  it("stores Dubai Marina, not Marsa Dubai", () => {
    const place = parseReverseGeocode({
      features: [{ properties: { feature_type: "neighborhood", name: "Marsa Dubai", context: { place: { name: "Dubai" } } } }],
    });
    expect(place?.place_name).toBe("Dubai Marina");
  });

  it("knows Metro Manila's cities as Manila, and a few nicknames", () => {
    expect(placeAliases("Makati")).toEqual(["Manila", "Metro Manila"]);
    expect(placeAliases("Taguig", "BGC")).toEqual(expect.arrayContaining(["Manila", "Bonifacio Global City"]));
    expect(placeAliases("Jumeirah Lakes Towers")).toEqual(["JLT"]);
    expect(placeAliases("Bangkok")).toEqual([]);
  });
});

describe("People search", () => {
  const base = mockPeople[0];
  const person: Person = {
    ...base,
    full_name: "Aisha Al Mansoori",
    phone: "+639175550142",
    city: "Makati",
    place_name: "Legazpi Village",
    notes: "Invests in logistics.",
    follow_up_note: "Send the Expo City deck",
    extras: { company: "Mansoori Capital", role: "CEO", email: "aisha@mansoori.example" },
    tags: ["Investor"],
  };
  const later: Encounter[] = [
    {
      id: "m1",
      person_id: person.id,
      met_at: "2026-09-30T10:00:00Z",
      met_timezone: null,
      place_name: "Nimman",
      city: "Chiang Mai",
      where_met_text: "Coffee at Ristr8to",
      note: "Wants a Gulf Maritime intro",
      transcript: null,
      duration_seconds: null,
    },
  ];
  const entry = searchEntry(person, later);
  const finds = (q: string) => matchesSearch(entry, q);

  it("finds the audit's misses: company, role, follow-up and Met again notes", () => {
    expect(finds("Mansoori Capital")).toBe(true);
    expect(finds("ceo")).toBe(true);
    expect(finds("Expo City")).toBe(true);
    expect(finds("Chiang Mai")).toBe(true);
    expect(finds("Gulf Maritime")).toBe(true);
    expect(finds("ristr8to")).toBe(true);
  });

  it("finds a phone number by its digits, with or without the leading 0", () => {
    expect(finds("0917")).toBe(true);
    expect(finds("917 555")).toBe(true);
    expect(finds("+63 917-555-0142")).toBe(true);
    expect(finds("0918")).toBe(false);
  });

  it("finds a place by the name people use", () => {
    expect(finds("manila")).toBe(true);
    expect(finds("legazpi")).toBe(true);
  });

  it("still needs every word to match", () => {
    expect(finds("aisha investor")).toBe(true);
    expect(finds("aisha bangkok")).toBe(false);
    expect(finds("")).toBe(true);
  });

  it("doesn't search another person's Met again notes", () => {
    expect(matchesSearch(searchEntry({ ...person, id: "someone-else" }, later), "Chiang Mai")).toBe(false);
  });
});
