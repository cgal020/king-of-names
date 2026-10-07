// Runs every sample transcript through the real extraction model and checks
// the fields that must come out right. Needs ANTHROPIC_API_KEY and
// EXTRACTION_MODEL in .env.local. Each run costs a few cents.
import { beforeAll, describe, expect, it } from "vitest";
import { SAMPLES } from "../fixtures/extraction-samples";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI may provide the variables directly.
}

const configured = Boolean(process.env.ANTHROPIC_API_KEY && process.env.EXTRACTION_MODEL);

describe.runIf(configured)(`extraction with ${process.env.EXTRACTION_MODEL}`, () => {
  let extractPerson: typeof import("@/lib/ai/extract").extractPerson;
  beforeAll(async () => {
    ({ extractPerson } = await import("@/lib/ai/extract"));
  });

  for (const sample of SAMPLES) {
    it(sample.id, async () => {
      const { clean } = await extractPerson({
        transcript: sample.transcript,
        recordedAt: sample.recordedAt,
        timezone: sample.timezone,
        knownTags: ["Investor", "Partner", "Logistics", "Hospitality"],
      });
      const e = sample.expect;
      if (e.full_name !== undefined) expect(clean.full_name).toBe(e.full_name);
      if (e.name_confidence) expect(e.name_confidence).toContain(clean.name_confidence);
      if (e.phone !== undefined) expect(clean.phone).toBe(e.phone);
      if (e.birthday) expect(clean.birthday).toEqual(e.birthday);
      if (e.follow_up_date === null) expect(clean.follow_up.date).toBeNull();
      // "Next Friday" from a Tuesday can fairly mean either Friday.
      if (sample.id === "relative-follow-up") expect(["2026-10-09", "2026-10-16"]).toContain(clean.follow_up.date);
      else if (e.follow_up_date) expect(clean.follow_up.date).toBe(e.follow_up_date);
      if (e.where_met_includes) expect(clean.where_met_text ?? "").toContain(e.where_met_includes);
      for (const name of e.additional_people_include ?? []) expect(clean.additional_people.join(" ")).toContain(name);
      for (const text of e.notes_exclude ?? []) expect(clean.notes ?? "").not.toContain(text);
    });
  }
});

it.skipIf(configured)("needs ANTHROPIC_API_KEY and EXTRACTION_MODEL in .env.local", () => {});
