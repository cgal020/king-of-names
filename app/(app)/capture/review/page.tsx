import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { formatDuration, formatMetDateTime } from "@/lib/format";
import { mockDraft } from "@/lib/mock/people";

export default function ReviewPage() {
  const draft = mockDraft;

  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader title="Review" showSettings={false} />
      <p className="-mt-1 mb-6 text-sm text-muted-foreground">
        Recorded {formatMetDateTime(draft.person.met_at, draft.person.met_timezone)}
        {draft.durationSeconds !== null && <> &middot; {formatDuration(draft.durationSeconds)}</>}
      </p>
      <PersonForm
        mode="review"
        initial={draft.person}
        transcript={draft.transcript}
        durationSeconds={draft.durationSeconds}
        nameConfidence={draft.nameConfidence}
      />
    </main>
  );
}
