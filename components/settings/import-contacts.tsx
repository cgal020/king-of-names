"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ContactRoundIcon, FileUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CardDetails } from "@/lib/cards/parse-qr";
import { contactsFromPicker, contactsFromVcf, type PickedContact } from "@/lib/contacts/import";

type ContactsManager = {
  select: (props: string[], options: { multiple: boolean }) => Promise<PickedContact[]>;
};

const noSubscribe = () => () => {};
// The Contact Picker exists on Chrome for Android only.
const hasPicker = () => "contacts" in navigator && "ContactsManager" in window;

// Brings existing contacts in from a .vcf file or the phone's contact picker,
// with a preview first. Imported people have no "where we met" until you add it.
export function ImportContacts() {
  const picker = useSyncExternalStore(noSubscribe, hasPicker, () => false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CardDetails[] | null>(null);

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const contacts = (await Promise.all(Array.from(files).map((f) => f.text()))).flatMap(contactsFromVcf);
    if (contacts.length === 0) toast.error("No contacts found in that file");
    else setPreview(contacts);
  }

  async function pickFromPhone() {
    try {
      const contacts = (navigator as unknown as { contacts: ContactsManager }).contacts;
      const picked = await contacts.select(["name", "tel", "email"], { multiple: true });
      const found = contactsFromPicker(picked);
      if (found.length) setPreview(found);
    } catch {
      // Picker closed without choosing anyone.
    }
  }

  if (preview) {
    return (
      <div className="rounded-2xl bg-muted p-4">
        <p className="font-medium">
          {preview.length === 1 ? "1 contact" : `${preview.length} contacts`} ready to import
        </p>
        <ul className="mt-2 max-h-48 divide-y overflow-y-auto text-[0.95rem]">
          {preview.slice(0, 50).map((c, i) => (
            <li key={i} className="flex justify-between gap-3 py-2">
              <span className="truncate font-medium">{c.full_name ?? "No name"}</span>
              <span className="shrink-0 truncate text-sm text-muted-foreground">{c.phones[0] ?? c.emails[0] ?? ""}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          They&rsquo;ll be added without a place or date. Add where you met when you next see them.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="touch" className="flex-1" onClick={() => setPreview(null)}>
            Cancel
          </Button>
          <Button
            size="touch"
            className="flex-[2]"
            onClick={() => {
              toast.success(`Imported ${preview.length} ${preview.length === 1 ? "contact" : "contacts"}`, {
                description: "Preview only. Nothing was stored.",
              });
              setPreview(null);
            }}
          >
            Import {preview.length}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        multiple
        hidden
        onChange={(e) => {
          void readFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {picker && (
        <Button variant="outline" size="touch-lg" onClick={pickFromPhone}>
          <ContactRoundIcon aria-hidden />
          Choose from phone contacts
        </Button>
      )}
      <Button variant="outline" size="touch-lg" onClick={() => fileRef.current?.click()}>
        <FileUpIcon aria-hidden />
        Import a contacts file (.vcf)
      </Button>
      <p className="text-sm text-muted-foreground">
        On iPhone, export from the Contacts app (select contacts, Share, Save to Files), then choose the file here.
      </p>
    </div>
  );
}
