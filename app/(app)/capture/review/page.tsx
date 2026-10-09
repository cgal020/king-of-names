import { ReviewScreen } from "@/components/capture/review-screen";
import { listPeople } from "@/lib/data/people";
import { REVIEW_STATES, type ReviewState } from "@/lib/mock/review-states";

export default async function ReviewPage({ searchParams }: PageProps<"/capture/review">) {
  const { capture, state } = await searchParams;
  const previewState = REVIEW_STATES.find((s) => s === state) as ReviewState | undefined;
  const people = await listPeople();
  return (
    <ReviewScreen
      captureId={typeof capture === "string" ? capture : null}
      previewState={previewState ?? null}
      people={people}
    />
  );
}
