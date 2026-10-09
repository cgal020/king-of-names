import { describe, expect, it } from "vitest";
import { cleanMentions, mentionedPerson } from "@/lib/people/mentioned";
import type { PersonInput } from "@/lib/people/validate";

const daniel: PersonInput = {
  full_name: "Daniel Reyes",
  met_at: "2026-10-07T21:14:00+04:00",
  met_timezone: "Asia/Dubai",
  lat: 25.08,
  lng: 55.14,
  location_accuracy_m: 12,
  place_name: "Dubai Marina",
  city: "Dubai",
  region: "Dubai",
  country: "United Arab Emirates",
  where_met_text: "Rooftop bar at Soho House",
  phone: "+639175550142",
  birthday_month: 3,
  birthday_day: 3,
  birthday_year: null,
  notes: "Runs a logistics company.",
  follow_up_note: "Send the deck",
  follow_up_date: "2026-10-10",
  extras: { company: "Reyes Logistics" },
  relationship: "business",
  tags: ["Supplier"],
};

describe("other people named in a note", () => {
  it("offers each name once, never the main person, at most five", () => {
    expect(cleanMentions([" Rosa  Reyes ", "rosa reyes", "Daniel Reyes", "", 42, "Ali", "Mei", "Omar", "Priya", "Kenji"], "Daniel Reyes")).toEqual([
      "Rosa Reyes",
      "Ali",
      "Mei",
      "Omar",
      "Priya",
    ]);
    expect(cleanMentions("Rosa", "Daniel")).toEqual([]);
  });

  it("saves them with the same time and place, and nothing about the main person", () => {
    const rosa = mentionedPerson("Rosa Reyes", daniel);
    expect(rosa).toMatchObject({
      full_name: "Rosa Reyes",
      met_at: daniel.met_at,
      met_timezone: "Asia/Dubai",
      lat: 25.08,
      lng: 55.14,
      place_name: "Dubai Marina",
      city: "Dubai",
      where_met_text: "Rooftop bar at Soho House",
      notes: "Mentioned in your note about Daniel Reyes.",
    });
    // Daniel's phone, birthday, follow-up, company and tags are his alone.
    expect(rosa.phone).toBeNull();
    expect(rosa.birthday_month).toBeNull();
    expect(rosa.follow_up_note).toBeNull();
    expect(rosa.extras).toEqual({});
    expect(rosa.relationship).toBeNull();
    expect(rosa.tags).toEqual([]);
  });
});
