"use server";

// Creating, changing and deleting your QR codes. A code's slug never changes,
// so what's printed keeps working; only where it sends people does.
import { revalidatePath } from "next/cache";
import { authConfigured } from "@/lib/auth/config";
import { newSlug, QrInputSchema } from "@/lib/qr/codes";
import { createClient } from "@/lib/supabase/server";

const MAX_CODES = 20;

export type QrSaveResult = { ok: true; id: string | null; preview?: boolean } | { ok: false; error: string };

export async function saveQr(id: string | null, input: unknown): Promise<QrSaveResult> {
  const parsed = QrInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  if (!authConfigured()) return { ok: true, id, preview: true };

  const supabase = await createClient();
  if (id) {
    const { data, error } = await supabase
      .from("qr_codes")
      .update({ label: parsed.data.label, destination: parsed.data.destination })
      .eq("id", id)
      .select("id");
    if (error || !data?.length) return { ok: false, error: "That didn’t save. Try again." };
  } else {
    const { count } = await supabase.from("qr_codes").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_CODES) return { ok: false, error: `You can have up to ${MAX_CODES} codes. Delete one first.` };
    // A clash between two random slugs is vanishingly rare; try again if it happens.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("qr_codes")
        .insert({ slug: newSlug(), label: parsed.data.label, destination: parsed.data.destination })
        .select("id")
        .single();
      if (!error && data) {
        id = data.id as string;
        break;
      }
      if (error?.code !== "23505") return { ok: false, error: "That didn’t save. Try again." };
    }
    if (!id) return { ok: false, error: "That didn’t save. Try again." };
  }
  revalidatePath("/settings");
  revalidatePath("/qr");
  return { ok: true, id };
}

export async function deleteQr(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!authConfigured()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("qr_codes").delete().eq("id", id);
  if (error) return { ok: false, error: "That didn’t delete. Try again." };
  revalidatePath("/settings");
  revalidatePath("/qr");
  return { ok: true };
}
