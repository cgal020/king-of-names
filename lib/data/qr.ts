import "server-only";
// The signed-in user's QR codes (row level security keeps them to their own),
// and, for the public /q page, a single code looked up by its slug.
import { authConfigured } from "@/lib/auth/config";
import { isSlug, QrDestinationSchema, type QrCode } from "@/lib/qr/codes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const COLUMNS = "id, slug, label, destination, scan_count, last_scanned_at";

type Row = { id: string; slug: string; label: string; destination: unknown; scan_count: number; last_scanned_at: string | null };

function toCode(row: Row): QrCode | null {
  const destination = QrDestinationSchema.safeParse(row.destination);
  if (!destination.success) return null;
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    destination: destination.data,
    scanCount: row.scan_count,
    lastScannedAt: row.last_scanned_at,
  };
}

export const SAMPLE_QR_CODES: QrCode[] = [
  {
    id: "sample-qr-contact",
    slug: "cam3ron1",
    label: "Save my contact",
    destination: {
      purpose: "contact",
      full_name: "Cameron Gallagher",
      company: "Gallagher Ventures",
      role: "Founder",
      phone: "+971555550100",
      email: "cameron@example.com",
      website: undefined,
    },
    scanCount: 42,
    lastScannedAt: "2026-10-08T19:12:00Z",
  },
  {
    id: "sample-qr-whatsapp",
    slug: "wa7cam22",
    label: "WhatsApp me",
    destination: { purpose: "whatsapp", phone: "971555550100", message: "Hi Cameron, we met at" },
    scanCount: 17,
    lastScannedAt: "2026-10-06T21:40:00Z",
  },
  {
    id: "sample-qr-link",
    slug: "deck2026",
    label: "See the deck",
    destination: { purpose: "link", url: "https://example.com/deck" },
    scanCount: 5,
    lastScannedAt: null,
  },
];

export async function listQrCodes(): Promise<QrCode[]> {
  if (!authConfigured()) return SAMPLE_QR_CODES;
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select(COLUMNS).order("created_at", { ascending: true });
  return ((data ?? []) as Row[]).flatMap((row) => toCode(row) ?? []);
}

export async function getQrCode(id: string): Promise<QrCode | null> {
  if (!authConfigured()) return SAMPLE_QR_CODES.find((c) => c.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? toCode(data as Row) : null;
}

// For the public /q/<slug> page: anyone with the code can open it.
export async function findQrBySlug(slug: string): Promise<QrCode | null> {
  if (!isSlug(slug)) return null;
  if (!authConfigured()) return SAMPLE_QR_CODES.find((c) => c.slug === slug) ?? null;
  const admin = createAdminClient();
  const { data } = await admin.from("qr_codes").select(COLUMNS).eq("slug", slug).maybeSingle();
  return data ? toCode(data as Row) : null;
}

export async function countScan(slug: string) {
  if (!authConfigured()) return;
  await createAdminClient().rpc("count_qr_scan", { scanned_slug: slug });
}
