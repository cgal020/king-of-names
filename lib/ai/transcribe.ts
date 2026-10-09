import "server-only";
import OpenAI, { toFile } from "openai";
import { audioFileName, TRANSCRIPTION_PROMPT } from "@/lib/ai/hints";

export class TranscriptionError extends Error {}

// Made on first use, so a missing key fails one note, not the whole server.
let client: OpenAI | null = null;
function openai() {
  if (!process.env.OPENAI_API_KEY) throw new TranscriptionError("OPENAI_API_KEY is not set");
  return (client ??= new OpenAI({ timeout: 30_000, maxRetries: 1 }));
}

// Speech to text. Only the audio and the hints leave the server.
export async function transcribe(audio: Uint8Array, mime: string, keywords: string[] = []): Promise<string> {
  const model = process.env.TRANSCRIPTION_MODEL;
  if (!model) throw new TranscriptionError("TRANSCRIPTION_MODEL is not set");
  const name = audioFileName(mime);
  if (!name) throw new TranscriptionError(`Unsupported audio type: ${mime}`);

  const request = { model, file: await toFile(audio, name, { type: mime.split(";")[0] }), prompt: TRANSCRIPTION_PROMPT };
  // gpt-transcribe takes keyword and language hints that the SDK types don't
  // list yet; OpenAI documents passing them through the request body.
  const hints = model.startsWith("gpt-transcribe")
    ? { body: { ...request, keywords, languages: (process.env.TRANSCRIPTION_LANGUAGES ?? "en").split(",") } }
    : undefined;

  const result = await openai().audio.transcriptions.create(request, hints);
  const text = result.text.trim();
  if (!text) throw new TranscriptionError("No speech found in the recording");
  return text;
}
