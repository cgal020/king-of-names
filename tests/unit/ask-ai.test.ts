import { describe, expect, it } from "vitest";
import { resolveCitations, sameName } from "@/lib/ask/citations";
import { peopleBlock } from "@/lib/ask/people-block";
import { mockLaterMeetings, mockPeople } from "@/lib/mock/people";

describe("peopleBlock", () => {
  const { text: block, byRef } = peopleBlock(mockPeople, mockLaterMeetings);

  it("lists everyone once, by a short label, with what Ask needs", () => {
    for (const [ref, p] of byRef) expect(block).toContain(`ref: ${ref} | name: ${p.full_name}`);
    expect(block.split("\n").filter((l) => l.startsWith("ref: "))).toHaveLength(mockPeople.length);
    expect(byRef.size).toBe(mockPeople.length);
    expect(block).toContain("met again 2026-09-30 in Dubai: Now looking at Melbourne restaurants");
    // No database ids for the model to copy.
    for (const p of mockPeople) expect(block).not.toContain(`id: ${p.id}`);
  });

  it("tells Ask about open tasks", () => {
    const p = mockPeople[0];
    const { text } = peopleBlock(mockPeople, mockLaterMeetings, [
      { id: "t1", person_id: p.id, title: "Introduce to Omar", due_date: "2026-10-20", done_at: null, created_at: "2026-10-01T00:00:00Z" },
      { id: "t2", person_id: p.id, title: "Done already", due_date: null, done_at: "2026-10-02T00:00:00Z", created_at: "2026-10-01T00:00:00Z" },
    ]);
    expect(text).toContain("to do: Introduce to Omar (due 2026-10-20)");
    expect(text).not.toContain("Done already");
  });

  it("leaves out phone numbers and email addresses", () => {
    for (const p of mockPeople) {
      if (p.phone) expect(block).not.toContain(p.phone);
      if (p.extras.email) expect(block).not.toContain(p.extras.email);
    }
  });

  it("is the same whatever order the people come in, so it can be cached", () => {
    expect(peopleBlock([...mockPeople].reverse(), mockLaterMeetings).text).toBe(block);
  });
});

describe("citations", () => {
  const { byRef } = peopleBlock(mockPeople, mockLaterMeetings);
  const refOf = (name: string) => [...byRef].find(([, p]) => p.full_name === name)![0];
  const [first, second] = mockPeople;

  it("matches names loosely but never to someone else", () => {
    expect(sameName("Nattapong Srisuk", "Nattapong")).toBe(true);
    expect(sameName("Nattapong Srisuk", "nattapong srisuk")).toBe(true);
    expect(sameName("José García", "Jose Garcia")).toBe(true);
    expect(sameName("Aisha Al Mansoori", "Nattapong Srisuk")).toBe(false);
  });

  it("keeps a citation whose label and name agree", () => {
    const cited = resolveCitations([{ ref: refOf(first.full_name), name: first.full_name, reason: " Met in Dubai " }], byRef, mockPeople);
    expect(cited).toEqual([{ id: first.id, reason: "Met in Dubai" }]);
  });

  it("follows the name when the label points at someone else", () => {
    // The audit's case: the answer meant one person, the label pointed at another.
    const cited = resolveCitations([{ ref: refOf(second.full_name), name: first.full_name, reason: "x" }], byRef, mockPeople);
    expect(cited.map((c) => c.id)).toEqual([first.id]);
  });

  it("drops a citation it can't pin to exactly one person", () => {
    expect(resolveCitations([{ ref: "P999", name: "Nobody Atall", reason: "x" }], byRef, mockPeople)).toEqual([]);
    expect(resolveCitations([{ ref: "P999", name: "", reason: "x" }], byRef, mockPeople)).toEqual([]);
  });

  it("lists each person once", () => {
    const ref = refOf(first.full_name);
    const cited = resolveCitations(
      [
        { ref, name: first.full_name, reason: "a" },
        { ref, name: first.full_name, reason: "b" },
      ],
      byRef,
      mockPeople,
    );
    expect(cited).toHaveLength(1);
  });
});
