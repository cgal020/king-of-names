// Reads the details behind a card's QR code link: the person's digital card
// page or contact file, never any other site (lib/cards/links.ts). Signed-in
// users only. Logs the error's kind only, never the link or what it said.
import { z } from "zod";
import { readLinkPage } from "@/lib/ai/read-link";
import { authConfigured } from "@/lib/auth/config";
import { fetchCardLink } from "@/lib/cards/fetch-card-link";
import { readCardLink } from "@/lib/cards/read-card-link";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const Body = z.object({ url: z.string().min(8).max(2048) });

export async function POST(request: Request) {
  if (!authConfigured()) return Response.json({ error: "Accounts aren't connected." }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return Response.json({ error: "Sign in first." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send the link." }, { status: 400 });
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const reading = await readCardLink(parsed.data.url, { fetch: fetchCardLink, readPage: readLinkPage });
    return Response.json({ details: reading?.details ?? null, from: reading?.from ?? null }, { headers });
  } catch (error) {
    // Unreachable or unreadable: the scan still has the QR and the photo.
    console.error("card link read failed", { name: (error as Error).name, code: (error as { code?: string }).code ?? null });
    return Response.json({ details: null, from: null }, { headers });
  }
}
