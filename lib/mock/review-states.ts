// Review screen states for the preview, opened with /capture/review?state=…
// so the failure screens can be seen without a failing pipeline.
import { mockDraft } from "@/lib/mock/people";
import type { Draft } from "@/lib/types";

export const REVIEW_STATES = ["transcription-failed", "extraction-failed", "place-failed"] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

const blank = {
  full_name: "",
  where_met_text: null,
  phone: null,
  birthday_month: null,
  birthday_day: null,
  birthday_year: null,
  notes: null,
  follow_up_note: null,
  follow_up_date: null,
  extras: {},
  relationship: null,
  tags: [],
};

export function reviewStateDraft(state: ReviewState): Draft {
  switch (state) {
    case "transcription-failed":
      return { ...mockDraft, transcript: null, nameConfidence: "high", failedSteps: ["transcription"], person: { ...mockDraft.person, ...blank } };
    case "extraction-failed":
      return { ...mockDraft, nameConfidence: "high", failedSteps: ["extraction"], person: { ...mockDraft.person, ...blank } };
    case "place-failed":
      return {
        ...mockDraft,
        failedSteps: ["geocoding"],
        person: { ...mockDraft.person, place_name: null, city: null, region: null, country: null },
      };
  }
}
