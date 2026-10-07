import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { cardReadingToDetails, CardSchema } from "@/lib/ai/card";
import { CARD_SYSTEM } from "@/lib/ai/prompt";
import type { CardDetails } from "@/lib/cards/parse-qr";

const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });

export class CardReadError extends Error {}

// Reads the details printed on a business card photo (JPEG, already cropped
// and shrunk on the phone). The image is sent inline and not stored by us
// anywhere but the user's private photos bucket.
export async function readCard(jpegBase64: string): Promise<CardDetails> {
  const model = process.env.EXTRACTION_MODEL;
  if (!model) throw new CardReadError("EXTRACTION_MODEL is not set");

  const response = await client.messages.parse({
    model,
    max_tokens: 1500,
    system: CARD_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpegBase64 } },
          { type: "text", text: "Read this business card." },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(CardSchema) },
  });

  if (response.stop_reason === "refusal") throw new CardReadError("The model declined this image");
  if (!response.parsed_output) throw new CardReadError("Couldn't read the card");
  return cardReadingToDetails(response.parsed_output);
}
