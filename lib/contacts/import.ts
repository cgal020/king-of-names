// Reads contacts to import: .vcf files (one or many cards) and the Android
// Contact Picker. Each contact becomes the same CardDetails a scanned card gives.
import { normalizePhone, parseQr, type CardDetails } from "@/lib/cards/parse-qr";

// Splits a .vcf export into single cards. Phones export many in one file.
export function splitVcards(text: string) {
  return text.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) ?? [];
}

export function contactsFromVcf(text: string): CardDetails[] {
  return splitVcards(text)
    .map((card) => parseQr(card).details)
    .filter((d) => d.full_name || d.phones.length || d.emails.length);
}

// Shape returned by navigator.contacts.select() on Chrome for Android.
export type PickedContact = { name?: string[]; tel?: string[]; email?: string[] };

export function contactsFromPicker(picked: PickedContact[]): CardDetails[] {
  return picked
    .map((c) => {
      const details = parseQr("").details;
      details.notes = null;
      details.full_name = c.name?.find(Boolean)?.trim() || null;
      details.phones = [...new Set((c.tel ?? []).map(normalizePhone).filter(Boolean))];
      details.emails = [...new Set((c.email ?? []).map((e) => e.trim()).filter(Boolean))];
      return details;
    })
    .filter((d) => d.full_name || d.phones.length || d.emails.length);
}
