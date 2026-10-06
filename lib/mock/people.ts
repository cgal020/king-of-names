// Sample data for the clickable mockup. Replaced by Supabase queries from
// milestone 3 onwards; delete this folder then.
import type { Draft, Person } from "@/lib/types";

type Seed = Partial<Person> & Pick<Person, "id" | "full_name" | "met_at">;

function person(seed: Seed): Person {
  return {
    met_timezone: null,
    lat: null,
    lng: null,
    location_accuracy_m: null,
    place_name: null,
    city: null,
    region: null,
    country: null,
    where_met_text: null,
    phone: null,
    birthday_month: null,
    birthday_day: null,
    birthday_year: null,
    notes: null,
    follow_up_note: null,
    follow_up_date: null,
    extras: {},
    created_at: seed.met_at,
    updated_at: seed.met_at,
    ...seed,
  };
}

const DUBAI = { city: "Dubai", region: "Dubai", country: "United Arab Emirates", met_timezone: "Asia/Dubai" };
const SYDNEY = { city: "Sydney", region: "New South Wales", country: "Australia", met_timezone: "Australia/Sydney" };
const MELBOURNE = { city: "Melbourne", region: "Victoria", country: "Australia", met_timezone: "Australia/Melbourne" };
const BANGKOK = { city: "Bangkok", region: "Bangkok", country: "Thailand", met_timezone: "Asia/Bangkok" };
const PHUKET = { city: "Phuket", region: "Phuket", country: "Thailand", met_timezone: "Asia/Bangkok" };

export const mockPeople: Person[] = [
  person({
    id: "zayed-khoury",
    full_name: "Zayed Khoury",
    met_at: "2026-10-04T19:40:00+04:00",
    ...DUBAI,
    lat: 25.1424, lng: 55.2259, location_accuracy_m: 14,
    place_name: "Alserkal Avenue",
    where_met_text: "the gallery night at Alserkal",
    notes: "Owns a contemporary gallery in Alserkal. Invited me to his opening on the 15th. Collects Australian Aboriginal art.",
    follow_up_note: "Go to the gallery opening, bring Priya",
    follow_up_date: "2026-10-15",
    extras: { company: "Khoury Contemporary", role: "Founder" },
  }),
  person({
    id: "priya-raman",
    full_name: "Priya Raman",
    met_at: "2026-09-28T21:15:00+04:00",
    ...DUBAI,
    lat: 25.0805, lng: 55.1403, location_accuracy_m: 9,
    place_name: "Dubai Marina",
    where_met_text: "rooftop at the Marina, Omar's birthday",
    phone: "+971 55 555 0193",
    notes: "Runs a design studio doing hotel fit-outs. Looking for a partner in Bangkok. Very direct, likes numbers up front.",
    follow_up_note: "Introduce her to Nok",
    follow_up_date: "2026-10-09",
    extras: { company: "Studio Raman", role: "Principal", email: "priya@studioraman.example" },
  }),
  person({
    id: "james-oconnell",
    full_name: "James O'Connell",
    met_at: "2026-08-14T18:30:00+10:00",
    ...SYDNEY,
    lat: -33.8599, lng: 151.209, location_accuracy_m: 21,
    place_name: "The Rocks",
    where_met_text: "the Glenmore pub after the airport conference",
    phone: "+61 412 555 018",
    birthday_day: 2, birthday_month: 7, birthday_year: 1979,
    notes: "Ex-Qantas, now advises airports on retail leasing. Huge Waratahs fan. Two kids at Sydney Grammar.",
    extras: { role: "Airport retail advisor" },
  }),
  person({
    id: "lachlan-brooks",
    full_name: "Lachlan Brooks",
    met_at: "2026-08-16T08:10:00+10:00",
    ...SYDNEY,
    lat: -33.8915, lng: 151.2767, location_accuracy_m: 32,
    place_name: "Bondi Beach",
    where_met_text: "Icebergs, morning swim",
    notes: "Founded a surf apparel brand. Wants manufacturing in Thailand, asked who I know in Bangkok.",
    extras: { company: "Saltline" },
  }),
  person({
    id: "mei-lin-chua",
    full_name: "Mei Lin Chua",
    met_at: "2026-08-15T20:00:00+10:00",
    ...SYDNEY,
    lat: -33.861, lng: 151.2016, location_accuracy_m: 12,
    place_name: "Barangaroo",
    where_met_text: "dinner at Barangaroo House",
    birthday_day: 19, birthday_month: 1,
    notes: "Venture partner at a climate fund. Grew up in Penang. Interested in cold-chain logistics in Southeast Asia.",
    extras: { role: "Venture partner" },
  }),
  person({
    id: "nok-srisawat",
    full_name: "Siriporn “Nok” Srisawat",
    met_at: "2026-06-02T17:45:00+07:00",
    ...BANGKOK,
    lat: 13.7795, lng: 100.544, location_accuracy_m: 18,
    place_name: "Ari",
    where_met_text: "her hotel site in Ari",
    phone: "+66 81 555 0147",
    notes: "Develops boutique hotels in Ari and Chiang Mai. Speaks fluent Japanese. Needs a fit-out designer.",
    extras: { company: "Baan Nok Hotels", role: "Managing director" },
  }),
  person({
    id: "thanakorn-wongsakul",
    full_name: "Thanakorn Wongsakul",
    met_at: "2026-06-03T12:30:00+07:00",
    ...BANGKOK,
    lat: 13.738, lng: 100.56, location_accuracy_m: 25,
    place_name: "Sukhumvit Soi 24",
    where_met_text: "lunch at Emporium",
    notes: "Cold-chain logistics, 40 trucks. Wants an introduction to Omar.",
  }),
  person({
    id: "aleksandra-nowak",
    full_name: "Aleksandra Nowak",
    met_at: "2025-11-18T19:00:00+07:00",
    ...BANGKOK,
    lat: 13.729, lng: 100.534, location_accuracy_m: 40,
    place_name: "Silom",
    where_met_text: "rooftop at Silom, through Hannah",
    birthday_day: 8, birthday_month: 4,
    notes: "Runs yoga retreats, moving them to Koh Phangan. Polish, lived in London ten years.",
  }),
  person({
    id: "tom-fitzgerald",
    full_name: "Tom Fitzgerald",
    met_at: "2026-03-20T22:00:00+11:00",
    ...MELBOURNE,
    lat: -37.798, lng: 144.978, location_accuracy_m: 15,
    place_name: "Fitzroy",
    where_met_text: "his wine bar on Gertrude Street",
    phone: "+61 433 555 072",
    notes: "Owns three restaurants in Fitzroy. Wants to open in Dubai next year.",
  }),
  person({
    id: "charlotte-nguyen",
    full_name: "Charlotte Nguyen",
    met_at: "2026-03-21T13:00:00+11:00",
    ...MELBOURNE,
    lat: -37.815, lng: 144.965, location_accuracy_m: 20,
    place_name: "Collins Street",
    where_met_text: "lunch with Tom",
    notes: "Commercial leasing lawyer, Tom's business partner. Sharp, reads every clause.",
    extras: { role: "Lawyer" },
  }),
  person({
    id: "kenji-watanabe",
    full_name: "Kenji Watanabe",
    met_at: "2026-01-09T16:20:00+07:00",
    ...PHUKET,
    lat: 7.846, lng: 98.338, location_accuracy_m: 28,
    place_name: "Chalong Pier",
    where_met_text: "yacht charter office at Chalong",
    notes: "Runs a yacht charter business. Plays golf every Saturday at Blue Canyon.",
    extras: { company: "Andaman Blue Charters" },
  }),
  person({
    id: "isabella-rossi",
    full_name: "Isabella Rossi",
    met_at: "2026-01-10T10:30:00+07:00",
    ...PHUKET,
    // Recorded on the boat with no GPS; city chosen by hand on the review screen.
    where_met_text: "on the boat to Phi Phi",
    notes: "Architect from Milan, designing a villa in Kamala. Knows Kenji.",
  }),
  person({
    id: "omar-al-mansouri",
    full_name: "Omar Al-Mansouri",
    met_at: "2025-02-11T20:30:00+04:00",
    ...DUBAI,
    lat: 25.2131, lng: 55.2797, location_accuracy_m: 11,
    place_name: "DIFC",
    where_met_text: "Zuma, DIFC",
    phone: "+971 50 555 0187",
    birthday_day: 14, birthday_month: 11,
    notes: "Family office, interested in Australian property. Prefers WhatsApp to calls.",
  }),
  person({
    id: "sofia-hadad",
    full_name: "Sofia Hadad",
    met_at: "2025-02-11T21:10:00+04:00",
    ...DUBAI,
    lat: 25.2136, lng: 55.282, location_accuracy_m: 16,
    place_name: "DIFC",
    where_met_text: "Zuma, with Omar",
    notes: "Partnerships at a freight forwarder. Introduced by Omar.",
  }),
  person({
    id: "hannah-clarke",
    full_name: "Hannah Clarke",
    met_at: "2025-09-04T18:00:00+01:00",
    city: "London", region: "England", country: "United Kingdom", met_timezone: "Europe/London",
    lat: 51.5094, lng: -0.149, location_accuracy_m: 10,
    place_name: "Mayfair",
    where_met_text: "drinks at Annabel's",
    notes: "Private banker. Knows everyone in the Gulf. Introduced me to Aleksandra.",
  }),
  person({
    id: "daniel-reyes",
    full_name: "Daniel Reyes",
    met_at: "2024-05-17T19:30:00+08:00",
    city: "Singapore", region: "Singapore", country: "Singapore", met_timezone: "Asia/Singapore",
    lat: 1.2834, lng: 103.8607, location_accuracy_m: 13,
    place_name: "Marina Bay",
    where_met_text: "the rooftop bar at Marina Bay Sands",
    phone: "+65 9155 0142",
    birthday_day: 3, birthday_month: 3,
    notes: "Runs a logistics company. Big into F1, goes to every Singapore race.",
  }),
];

export function getMockPerson(id: string) {
  return mockPeople.find((p) => p.id === id) ?? null;
}

// Where the phone "is" for the mockup's location chip and "Near me".
export const mockCurrentLocation = {
  lat: 25.085,
  lng: 55.145,
  accuracy: 12,
  placeName: "Dubai Marina",
  city: "Dubai",
};

export const mockDraft: Draft = {
  captureId: "draft-1",
  transcript:
    "Met Sofia Haddad at the rooftop bar at Soho House, she runs partnerships for a freight company, " +
    "birthday is March 3rd, number is plus nine seven one fifty five five five zero one four two. " +
    "Remind me to send her the deck next Friday.",
  durationSeconds: 14,
  nameConfidence: "medium",
  additionalPeople: [],
  person: {
    full_name: "Sofia Haddad",
    met_at: "2026-10-06T21:42:00+04:00",
    met_timezone: "Asia/Dubai",
    lat: 25.0852, lng: 55.1449, location_accuracy_m: 12,
    place_name: "Dubai Marina",
    city: "Dubai",
    region: "Dubai",
    country: "United Arab Emirates",
    where_met_text: "the rooftop bar at Soho House",
    phone: "+971555550142",
    birthday_month: 3,
    birthday_day: 3,
    birthday_year: null,
    notes: "Runs partnerships for a freight company.",
    follow_up_note: "Send her the deck",
    follow_up_date: "2026-10-09",
    extras: { role: "Partnerships" },
  },
};

// A capture left unreviewed, shown in the "Needs review" strip.
export const mockPendingReview = {
  captureId: mockDraft.captureId,
  recordedAt: "2026-10-06T21:42:00+04:00",
  preview: "Met Sofia Haddad at the rooftop bar at Soho House…",
};

export const mockCities = Array.from(
  mockPeople.reduce((map, p) => {
    if (!p.city) return map;
    const entry = map.get(p.city) ?? { city: p.city, country: p.country, count: 0 };
    entry.count += 1;
    return map.set(p.city, entry);
  }, new Map<string, { city: string; country: string | null; count: number }>()).values(),
).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

// Original voice notes for a few sample people; the rest were added by hand.
export const mockNotes: Record<string, { transcript: string; durationSeconds: number }> = {
  "zayed-khoury": {
    transcript:
      "Zayed Khoury, owns the gallery at Alserkal, Khoury Contemporary. Opening on the fifteenth, he invited me, " +
      "bring Priya. Collects Aboriginal art from Australia.",
    durationSeconds: 17,
  },
  "priya-raman": {
    transcript:
      "Priya Raman, design studio, hotel fit-outs. Met at Omar's birthday on the rooftop at the Marina. " +
      "Wants a partner in Bangkok, introduce her to Nok. Likes numbers up front.",
    durationSeconds: 21,
  },
  "james-oconnell": {
    transcript:
      "James O'Connell at the Glenmore after the conference. Ex-Qantas, now advises airports on retail leasing. " +
      "Birthday second of July, seventy-nine. Waratahs fan, two kids at Sydney Grammar.",
    durationSeconds: 19,
  },
};
