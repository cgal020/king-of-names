import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { LinkPageSchema, linkReadingToDetails } from "@/lib/ai/card";
import { LINK_SYSTEM } from "@/lib/ai/prompt";
import type { CardDetails } from "@/lib/cards/parse-qr";

export class LinkReadError extends Error {}

let client: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new LinkReadError("ANTHROPIC_API_KEY is not set");
  return (client ??= new Anthropic({ timeout: 20_000, maxRetries: 1 }));
}

// Reads a person's details from the text of their digital card's page (see
// lib/cards/page-text.ts). Null when the page isn't someone's card.
export async function readLinkPage(pageText: string): Promise<CardDetails | null> {
  const model = process.env.EXTRACTION_MODEL;
  if (!model) throw new LinkReadError("EXTRACTION_MODEL is not set");

  const response = await anthropic().messages.parse({
    model,
    max_tokens: 1500,
    system: LINK_SYSTEM,
    messages: [{ role: "user", content: `<page>\n${pageText}\n</page>` }],
    output_config: { format: zodOutputFormat(LinkPageSchema) },
  });

  if (response.stop_reason === "refusal") throw new LinkReadError("The model declined this page");
  if (!response.parsed_output) throw new LinkReadError("Couldn't read the page");
  return linkReadingToDetails(response.parsed_output);
}
