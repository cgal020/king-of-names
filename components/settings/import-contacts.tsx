"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { CheckIcon, ContactRoundIcon, FileUpIcon } from "lucide-react";
import { importContacts, undoImport } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { authConfigured } from "@/lib/auth/config";
import type { CardDetails } from "@/lib/cards/parse-qr";
import { contactsFromPicker, contactsFromVcf, type PickedContact } from "@/lib/contacts/import";
import { describeFill, fillsAnything, matchContact, missingDetails } from "@/lib/contacts/match";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

type ContactsManager = {
  select: (props: string[], options: { multiple: boolean }) => Promise<PickedContact[]>;
};

const noSubscribe = () => () => {};

// " as Dan Reyes" when the saved name differs from the contact's.
const savedAs = ({ contact, match }: { contact: CardDetails; match: { full_name: string } | null }) =>
  match && match.full_name.trim().toLowerCase() !== contact.full_name?.trim().toLowerCase() ? ` as ${match.full_name}` : "";
// The Contact Picker exists on Chrome for Android only.
const hasPicker = () => "contacts" in navigator && "ContactsManager" in window;

// Brings existing contacts in from a .vcf file or the phone's contact picker,
// with a preview first. Someone already saved isn't added again: they only
// get the details they're missing. New people are marked as imported, with
// no meeting date or place until you add one. One tap undoes an import.
export function ImportContacts({ people }: { people: Person[] }) {
  const picker = useSyncExternalStore(noSubscribe, hasPicker, () => false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CardDetails[] | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  // Who each contact is: someone new, someone saved with details to add, or
  // someone saved already, with nothing new.
  const rows = useMemo(
    () =>
      (preview ?? []).map((contact) => {
        const match = contact.full_name ? matchContact(contact, people) : null;
        const fill = match ? missingDetails(contact, match) : null;
        return { contact, match, fill, nothingNew: Boolean(match && fill && !fillsAnything(fill)) };
      }),
    [preview, people],
  );
  const chosen = rows.filter((r, i) => r.contact.full_name && !r.nothingNew && !skip.has(i));

  function show(contacts: CardDetails[]) {
    setSkip(new Set());
    setPreview(contacts);
  }

  async function importChosen() {
    setImporting(true);
    const result = await importContacts(
      chosen.map((r) => r.contact),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ).catch(() => ({ ok: false as const, error: "The import didn’t save. Check your connection and try again." }));
    setImporting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const parts = [
      result.added && `Added ${result.added} ${result.added === 1 ? "person" : "people"}`,
      result.updated && `updated ${result.updated}`,
    ].filter(Boolean);
    const undo = result.undo;
    toast.success(parts.join(", ") || "Nothing new to import", {
      description: authConfigured() ? undefined : "Preview only. Nothing was stored.",
      duration: 10_000,
      action: undo
        ? {
            label: "Undo",
            onClick: () => {
              void undoImport(undo).then((r) =>
                r.ok ? toast("Import undone") : toast.error("Couldn’t undo the import", { description: "Check your connection and try again." }),
              );
            },
          }
        : undefined,
    });
    setPreview(null);
  }

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const contacts = (await Promise.all(Array.from(files).map((f) => f.text()))).flatMap(contactsFromVcf);
    if (contacts.length === 0) toast.error("No contacts found in that file");
    else show(contacts);
  }

  async function pickFromPhone() {
    try {
      const contacts = (navigator as unknown as { contacts: ContactsManager }).contacts;
      const picked = await contacts.select(["name", "tel", "email"], { multiple: true });
      const found = contactsFromPicker(picked);
      if (found.length) show(found);
    } catch {
      // Picker closed without choosing anyone.
    }
  }

  if (preview) {
    const added = chosen.filter((r) => !r.match).length;
    const updated = chosen.filter((r) => r.match).length;
    return (
      <div className="rounded-2xl bg-muted p-4">
        <p className="font-medium">
          {preview.length === 1 ? "1 contact" : `${preview.length} contacts`} in the file
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[`${added} new`, updated && `${updated} already saved, with details to add`].filter(Boolean).join(" · ")}
        </p>
        <ul className="mt-2 max-h-64 divide-y overflow-y-auto text-[0.95rem]">
          {rows.slice(0, 200).map((r, i) => {
            const usable = Boolean(r.contact.full_name) && !r.nothingNew;
            const on = usable && !skip.has(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={!usable}
                  onClick={() =>
                    setSkip((current) => {
                      const next = new Set(current);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-3 py-2 text-left disabled:opacity-60"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.contact.full_name ?? "No name"}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {!r.contact.full_name
                        ? "Left out: no name"
                        : r.nothingNew
                          ? `Already saved${savedAs(r)}, nothing new`
                          : r.match
                            ? `Already saved${savedAs(r)} · adds ${describeFill(r.fill!)}`
                            : (r.contact.phones[0] ?? r.contact.emails[0] ?? r.contact.company ?? "New")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          New people are marked as imported, with no meeting date or place. Add where you met when you next see them.
          People already saved only get the details they&rsquo;re missing.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="touch" className="flex-1" onClick={() => setPreview(null)}>
            Cancel
          </Button>
          <Button size="touch" className="flex-[2]" disabled={importing || chosen.length === 0} onClick={() => void importChosen()}>
            {importing ? "Importing…" : `Import ${chosen.length}`}
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
