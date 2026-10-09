// One photo: PATCH changes what it shows (them, their card, the place);
// DELETE removes the file and the row. Signed-in users only; row level
// security keeps it to the account's own photos.
import { z } from "zod";
import { authConfigured } from "@/lib/auth/config";
import { getPhotoRow } from "@/lib/data/photos";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";

const Patch = z.object({ kind: z.enum(["person", "card", "moment"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!authConfigured() || !isPersonId(id)) return Response.json({ error: "No such photo." }, { status: 404 });
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send a kind: person, card or moment." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("photos").update({ kind: parsed.data.kind }).eq("id", id).select("id");
  if (error) return Response.json({ error: "That didn’t save." }, { status: 503 });
  if (!data?.length) return Response.json({ error: "No such photo." }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!authConfigured() || !isPersonId(id)) return Response.json({ error: "No such photo." }, { status: 404 });
  const supabase = await createClient();
  const row = await getPhotoRow(supabase, id);
  if (!row) return Response.json({ ok: true });
  await supabase.storage.from("photos").remove([row.storage_path]);
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return Response.json({ error: "That didn’t delete." }, { status: 503 });
  return Response.json({ ok: true });
}
