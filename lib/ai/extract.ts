import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { EXTRACTION_SYSTEM, extractionUserMessage, type ExtractionContext } from "@/lib/ai/prompt";
import { ExtractionSchema, normalizeExtraction, type CleanExtraction } from "@/lib/ai/schema";

// One client per server instance; it holds no per-request state.
const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });

export class ExtractionError extends Error {}

function model() {
  const id = process.env.EXTRACTION_MODEL;
  if (!id) throw new ExtractionError("EXTRACTION_MODEL is not set");
  return id;
}

// Turns a transcript into profile fields. Only the transcript, the recording
// time and the user's tag names are sent; nothing else about the user.
export async function extractPerson(context: ExtractionContext): Promise<{ raw: unknown; clean: CleanExtraction }> {
  const response = await client.messages.parse({
    model: model(),
    max_tokens: 2000,
    system: EXTRACTION_SYSTEM,
    messages: [{ role: "user", content: extractionUserMessage(context) }],
    output_config: { format: zodOutputFormat(ExtractionSchema) },
  });

  if (response.stop_reason === "refusal") throw new ExtractionError("The model declined this note");
  if (response.stop_reason === "max_tokens") throw new ExtractionError("The extraction was cut off");
  if (!response.parsed_output) throw new ExtractionError("The extraction didn't match the schema");

  return { raw: response.parsed_output, clean: normalizeExtraction(response.parsed_output, new Date(context.recordedAt)) };
}
