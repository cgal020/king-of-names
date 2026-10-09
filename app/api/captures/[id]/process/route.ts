// Runs a stored note through transcription, extraction and the place lookup.
// Called by Capture right after the upload, and by Review for a note that was
// sent later from the phone's queue. ?retry=1 tries a failed note again.
// Never logs transcripts, names or phone numbers.
import { authConfigured } from "@/lib/auth/config";
import { draftFromRow, getCapture, processStoredCapture } from "@/lib/data/captures";
import { listPeople } from "@/lib/data/people";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";

// Transcription and extraction together usually take 5 to 10 seconds.
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!authConfigured()) return Response.json({ error: "Accounts aren't connected." }, { status: 503 });
  if (!isPersonId(id)) return Response.json({ error: "No such note." }, { status: 404 });

  const supabase = await createClient();
  const row = await getCapture(supabase, id);
  if (!row) return Response.json({ error: "No such note." }, { status: 404 });
  if (row.status === "confirmed" || row.status === "discarded") {
    return Response.json({ error: "This note has already been saved or discarded." }, { status: 409 });
  }

  const retry = new URL(request.url).searchParams.get("retry") === "1";
  const done = row.status === "extracted" || (row.status === "failed" && !retry);
  if (done) {
    const draft = draftFromRow(row);
    return Response.json({ status: row.status, failedSteps: draft.failedSteps, draft });
  }

  try {
    const result = await processStoredCapture(supabase, row, await listPeople());
    console.info("capture processed", { captureId: id, status: result.status, failedSteps: result.failedSteps });
    const processed = await getCapture(supabase, id);
    return Response.json({ status: result.status, failedSteps: result.failedSteps, draft: processed ? draftFromRow(processed) : null });
  } catch {
    console.error("capture processing failed", { captureId: id });
    return Response.json({ error: "This note couldn't be processed. Try again in a moment." }, { status: 503 });
  }
}
