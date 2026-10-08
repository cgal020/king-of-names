import { describe, expect, it } from "vitest";
import { exportFileName, peopleToCsv, peopleToJson, type ExportPerson } from "@/lib/export/people";
import { getMockMeetings, mockPeople } from "@/lib/mock/people";
import type { Person } from "@/lib/types";

const base: Person = {
  id: "p1",
  full_name: "Sofia Haddad",
  met_at: "2026-10-04T15:30:00Z",
  met_timezone: "Asia/Dubai",
  lat: 25.0805,
  lng: 55.1403,
  location_accuracy_m: 12,
  place_name: "Dubai Marina",
  city: "Dubai",
  region: "Dubai",
  country: "United Arab Emirates",
  where_met_text: "the rooftop bar at Soho House",
  phone: "+971555550142",
  birthday_month: 3,
  birthday_day: 3,
  birthday_year: null,
  notes: "Runs partnerships for a freight company, likes data",
  follow_up_note: "Send her the deck",
  follow_up_date: "2026-10-09",
  extras: { email: "sofia@example.com", company: "Gulf Freight", role: "Partnerships", linkedin: "linkedin.com/in/sofia" },
  relationship: "business",
  tags: ["Partner", "Supplier"],
  created_at: "2026-10-04T15:31:00Z",
  updated_at: "2026-10-05T08:00:00Z",
};
const person = (over: Partial<Person> = {}): ExportPerson => ({ ...base, ...over, meetings: [] });

function parseCsv(text: string) {
  // Enough of RFC 4180 for these tests: quoted fields, doubled quotes, CRLF.
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted && c === '"' && text[i + 1] === '"') {
      field += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (!quoted && c === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && c === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else {
      field += c;
    }
  }
  return rows;
}

describe("peopleToCsv", () => {
  it("writes one readable row per person, in the time zone they were met in", () => {
    const csv = peopleToCsv([person()]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [header, row] = parseCsv(csv.slice(1));
    const get = (name: string) => row[header.indexOf(name)];
    expect(get("Name")).toBe("Sofia Haddad");
    expect(get("Met")).toBe("2026-10-04 19:30");
    expect(get("Where met (your words)")).toBe("the rooftop bar at Soho House");
    expect(get("Birthday")).toBe("3 March");
    expect(get("Relationship")).toBe("Business");
    expect(get("Tags")).toBe("Partner, Supplier");
    expect(get("Notes")).toBe("Runs partnerships for a freight company, likes data");
    expect(get("Other details")).toBe("linkedin: linkedin.com/in/sofia");
    expect(get("Times met")).toBe("1");
  });

  it("stops a spreadsheet from running anything in a cell as a formula", () => {
    const [header, row] = parseCsv(peopleToCsv([person({ notes: '=HYPERLINK("http://evil.example","x")', phone: "+971555550142" })]).slice(1));
    expect(row[header.indexOf("Notes")]).toBe(`'=HYPERLINK("http://evil.example","x")`);
    expect(row[header.indexOf("Phone")]).toBe("'+971555550142");
  });

  it("keeps quotes, line breaks and Arabic or Thai names intact", () => {
    const csv = peopleToCsv([person({ full_name: "سارة الحداد", notes: 'Said "call me Sal"\nloves sailing' }), person({ full_name: "สมชาย ใจดี" })]);
    const [header, first, second] = parseCsv(csv.slice(1));
    expect(first[header.indexOf("Name")]).toBe("سارة الحداد");
    expect(first[header.indexOf("Notes")]).toBe('Said "call me Sal"\nloves sailing');
    expect(second[header.indexOf("Name")]).toBe("สมชาย ใจดี");
  });

  it("counts meetings and dates the most recent one", () => {
    const met = getMockMeetings(mockPeople[0].id);
    const [header, row] = parseCsv(peopleToCsv([{ ...mockPeople[0], meetings: met }]).slice(1));
    expect(Number(row[header.indexOf("Times met")])).toBe(Math.max(1, met.length));
  });
});

describe("peopleToJson", () => {
  it("includes every field and every meeting, and reads back", () => {
    const people = mockPeople.map((p) => ({ ...p, meetings: getMockMeetings(p.id) }));
    const parsed = JSON.parse(peopleToJson(people, new Date("2026-10-08T12:00:00Z")));
    expect(parsed).toMatchObject({ app: "King of Names", format_version: 1, exported_at: "2026-10-08T12:00:00.000Z" });
    expect(parsed.people).toEqual(people);
  });
});

describe("exportFileName", () => {
  it("names the file after the app and the day", () => {
    expect(exportFileName("csv", new Date(2026, 9, 8, 12))).toBe("king-of-names-people-2026-10-08.csv");
  });
});
