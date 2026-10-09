import { describe, expect, it } from "vitest";
import { peopleBlock } from "@/lib/ask/people-block";
import { mockLaterMeetings, mockPeople } from "@/lib/mock/people";

describe("peopleBlock", () => {
  const block = peopleBlock(mockPeople, mockLaterMeetings);

  it("lists everyone once, by id, with what Ask needs", () => {
    for (const p of mockPeople) expect(block).toContain(`id: ${p.id} | name: ${p.full_name}`);
    expect(block.split("\n").filter((l) => l.startsWith("id: "))).toHaveLength(mockPeople.length);
    expect(block).toContain("met again 2026-09-30 in Dubai: Now looking at Melbourne restaurants");
  });

  it("leaves out phone numbers and email addresses", () => {
    for (const p of mockPeople) {
      if (p.phone) expect(block).not.toContain(p.phone);
      if (p.extras.email) expect(block).not.toContain(p.extras.email);
    }
  });

  it("is the same whatever order the people come in, so it can be cached", () => {
    expect(peopleBlock([...mockPeople].reverse(), mockLaterMeetings)).toBe(block);
  });
});
