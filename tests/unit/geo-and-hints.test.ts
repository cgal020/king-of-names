import { describe, expect, it } from "vitest";
import { cardReadingToDetails } from "@/lib/ai/card";
import { audioFileName, transcriptionKeywords } from "@/lib/ai/hints";
import { parseReverseGeocode, reverseGeocodeUrl } from "@/lib/geo/mapbox";
import { mockPeople } from "@/lib/mock/people";

describe("parseReverseGeocode (Mapbox v6)", () => {
  it("names the neighbourhood as the place and the city separately", () => {
    const place = parseReverseGeocode({
      type: "FeatureCollection",
      features: [
        {
          properties: {
            feature_type: "address",
            name: "12 Marina Walk",
            context: {
              address: { name: "12 Marina Walk" },
              street: { name: "Marina Walk" },
              neighborhood: { name: "Dubai Marina" },
              place: { name: "Dubai" },
              region: { name: "Dubai" },
              country: { name: "United Arab Emirates", country_code: "ae" },
            },
          },
        },
      ],
    });
    expect(place).toEqual({
      place_name: "Dubai Marina",
      city: "Dubai",
      region: "Dubai",
      country: "United Arab Emirates",
      country_code: "AE",
    });
  });

  it("falls back to the street, and to locality when there is no place", () => {
    const place = parseReverseGeocode({
      features: [
        {
          properties: {
            feature_type: "street",
            name: "Sukhumvit Soi 24",
            context: { locality: { name: "Khlong Toei" }, region: { name: "Bangkok" }, country: { name: "Thailand" } },
          },
        },
      ],
    });
    expect(place).toMatchObject({ place_name: "Sukhumvit Soi 24", city: "Khlong Toei", country: "Thailand" });
  });

  it("returns null when Mapbox finds nothing (open sea)", () => {
    expect(parseReverseGeocode({ type: "FeatureCollection", features: [] })).toBeNull();
  });

  it("asks for permanent results in English", () => {
    const url = new URL(reverseGeocodeUrl(25.0805, 55.1403, "tok"));
    expect(url.pathname).toBe("/search/geocode/v6/reverse");
    expect(url.searchParams.get("permanent")).toBe("true");
    expect(url.searchParams.get("latitude")).toBe("25.080500");
  });
});

describe("transcription hints", () => {
  it("builds keywords from the user's people, recent first and deduplicated", () => {
    const keywords = transcriptionKeywords(mockPeople);
    expect(keywords[0]).toBe("Zayed Khoury");
    expect(keywords).toContain("Siriporn Nok Srisawat");
    expect(keywords).toContain("Studio Raman");
    expect(new Set(keywords.map((k) => k.toLowerCase())).size).toBe(keywords.length);
    expect(keywords.length).toBeLessThanOrEqual(60);
  });

  it("maps recorder formats to file names the API recognises", () => {
    expect(audioFileName("audio/mp4")).toBe("note.m4a");
    expect(audioFileName("audio/webm;codecs=opus")).toBe("note.webm");
    expect(audioFileName("audio/ogg")).toBeNull();
  });
});

describe("cardReadingToDetails", () => {
  it("cleans a model's card reading into card details", () => {
    const details = cardReadingToDetails({
      full_name: " Sofia Haddad ",
      company: "Gulf Freight Partners",
      role: "Head of Partnerships",
      phones: ["+971 55 555 0142", "+971555550142", "ext 12"],
      emails: ["Sofia@GulfFreight.example", "not an email"],
      websites: ["gulffreight.example"],
      linkedin: null,
      address: "Jebel Ali Free Zone, Dubai",
      other_details: [{ label: "Arabic name", value: "صوفيا حداد" }],
    });
    expect(details).toMatchObject({
      full_name: "Sofia Haddad",
      phones: ["+971555550142"],
      emails: ["sofia@gulffreight.example"],
      websites: ["https://gulffreight.example"],
      notes: "Arabic name: صوفيا حداد",
    });
  });
});
