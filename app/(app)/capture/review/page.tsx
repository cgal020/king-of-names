import { ReviewScreen } from "@/components/capture/review-screen";
import { loadNoteForReview } from "@/lib/data/captures";
import { listPeople, usingSampleData } from "@/lib/data/people";
import { REVIEW_STATES, type ReviewState } from "@/lib/mock/review-states";

// A note sent later from the phone is processed while this page loads.
export const maxDuration = 60;

export default async function ReviewPage({ searchParams }: PageProps<"/capture/review">) {
  const { capture, state } = await searchParams;
  const captureId = typeof capture === "string" ? capture : null;
  const previewState = REVIEW_STATES.find((s) => s === state) as ReviewState | undefined;
  const people = await listPeople();
  // undefined: the sample-data preview, where drafts come from the phone.
  const note = usingSampleData() ? undefined : captureId ? await loadNoteForReview(captureId, people) : null;
  return <ReviewScreen captureId={captureId} previewState={previewState ?? null} people={people} note={note} />;
}
