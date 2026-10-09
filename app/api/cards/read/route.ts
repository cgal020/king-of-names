// Reads the details printed on a business card photo with the extraction
// model. The photo (a JPEG re-encoded on the phone, so without EXIF) is sent
// inline and not stored here. Signed-in users only; never logs what it read.
import { z } from "zod";
import { readCard } from "@/lib/ai/read-card";
import { authConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// About 4 MB of JPEG once decoded: far above a phone photo shrunk to 2048 px.
const Body = z.object({ image: z.string().min(100).max(5_600_000).regex(/^[A-Za-z0-9+/=]+$/) });

export async function POST(request: Request) {
  if (!authConfigured()) return Response.json({ error: "Accounts aren't connected." }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return Response.json({ error: "Sign in first." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send the card photo as a JPEG." }, { status: 400 });
  try {
    return Response.json({ details: await readCard(parsed.data.image) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    // The error's kind and status only, never what the card said.
    console.error("card read failed", { name: (error as Error).name, status: (error as { status?: number }).status ?? null });
    return Response.json({ error: "The card couldn't be read." }, { status: 503 });
  }
}
