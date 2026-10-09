// Runs a stored note through transcription, extraction and the place lookup.
// Called by Capture right after the upload, and by Review for a note that was
// sent later from the phone's queue. ?retry=1 tries a failed note again.
// Asked for with Accept: application/x-ndjson, it reports each step as one
// line as it finishes ({"step","ok"}), then the result ({"result"} or
// {"error"}), so Capture shows real progress. Never logs transcripts, names
// or phone numbers.
import { authConfigured } from "@/lib/auth/config";
import { draftFromRow, getCapture, processStoredCapture } from "@/lib/data/captures";
import { listPeople } from "@/lib/data/people";
import { isPersonId } from "@/lib/people/validate";
import type { PipelineStep } from "@/lib/pipeline/process-capture";
import { createClient } from "@/lib/supabase/server";

// Transcription and extraction together usually take 5 to 10 seconds.
export const maxDuration = 60;

const FAILED = "This note couldn't be processed. Try again in a moment.";

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
  const progress = request.headers.get("accept")?.includes("application/x-ndjson") ?? false;
  // Their names help transcription spell people right.
  const people = done ? [] : await listPeople();

  const run = async (onStep?: (step: PipelineStep, ok: boolean) => void) => {
    if (done) {
      const draft = draftFromRow(row);
      return { status: row.status, failedSteps: draft.failedSteps, draft };
    }
    const result = await processStoredCapture(supabase, row, people, onStep);
    console.info("capture processed", { captureId: id, status: result.status, failedSteps: result.failedSteps });
    const processed = await getCapture(supabase, id);
    return { status: result.status, failedSteps: result.failedSteps, draft: processed ? draftFromRow(processed) : null };
  };

  if (!progress) {
    try {
      return Response.json(await run());
    } catch {
      console.error("capture processing failed", { captureId: id });
      return Response.json({ error: FAILED }, { status: 503 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (line: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
      try {
        send({ result: await run((step, ok) => send({ step, ok })) });
      } catch {
        console.error("capture processing failed", { captureId: id });
        send({ error: FAILED });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
