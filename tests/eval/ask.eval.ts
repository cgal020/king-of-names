// Runs Ask questions over the sample people through the real model and checks
// who it cites. Needs ANTHROPIC_API_KEY and EXTRACTION_MODEL (or ASK_MODEL)
// in .env.local. Each run costs a few cents.
import { beforeAll, describe, expect, it } from "vitest";
import { mockLaterMeetings, mockPeople } from "@/lib/mock/people";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI may provide the variables directly.
}

const configured = Boolean(process.env.ANTHROPIC_API_KEY && (process.env.ASK_MODEL || process.env.EXTRACTION_MODEL));
// Everyone first met in a city, or met there again later.
const inCity = (city: string) =>
  [...new Set([...mockPeople.filter((p) => p.city === city).map((p) => p.id), ...mockLaterMeetings.filter((m) => m.city === city).map((m) => m.person_id)])].sort();

describe.runIf(configured)(`Ask with ${process.env.ASK_MODEL || process.env.EXTRACTION_MODEL}`, () => {
  let ask: typeof import("@/lib/ai/ask").askAboutPeople;
  beforeAll(async () => {
    ({ askAboutPeople: ask } = await import("@/lib/ai/ask"));
  });
  const run = (question: string, history: { question: string; answer: string }[] = []) =>
    ask({ question, history, people: mockPeople, laterMeetings: mockLaterMeetings, now: new Date("2026-10-09T09:00:00+04:00"), timeZone: "Asia/Dubai" });

  it("finds everyone met in a city", async () => {
    const r = await run("Who do I know in Bangkok?");
    expect(r.people.map((p) => p.id).sort()).toEqual(inCity("Bangkok"));
  });

  it("finds people by what they do, from the notes", async () => {
    const r = await run("Who works in logistics or shipping?");
    const ids = r.people.map((p) => p.id);
    expect(ids).toContain("thanakorn-wongsakul");
    expect(ids.every((id) => mockPeople.some((p) => p.id === id))).toBe(true);
  });

  it("says so when nobody fits, and cites no one", async () => {
    const r = await run("Who plays the cello?");
    expect(r.people).toEqual([]);
  });

  it("follows up on the previous question", async () => {
    const first = await run("Who do I know in Dubai?");
    const r = await run("Which of them are investors?", [{ question: "Who do I know in Dubai?", answer: first.answer }]);
    expect(r.people.map((p) => p.id)).toContain("omar-al-mansouri");
    expect(r.people.every(({ id }) => inCity("Dubai").includes(id))).toBe(true);
  });
});
