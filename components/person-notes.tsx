"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { addNote } from "@/app/actions/people";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authConfigured } from "@/lib/auth/config";

// "9 Oct 2026", in the phone's own time.
const today = () => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date());

// A person's notes, with a quick way to add one without opening Edit. Each
// added note starts with its date.
export function PersonNotes({ personId, initial }: { personId: string; initial: string | null }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true);
    const result = await addNote(personId, text, today()).catch(() => ({
      ok: false as const,
      error: "That didn’t save. Check your connection and try again.",
    }));
    setSaving(false);
    if (!result.ok) return void toast.error(result.error);
    // The preview returns only the new note; the server returns them all.
    setNotes(authConfigured() ? result.notes : [notes, result.notes].filter(Boolean).join("\n\n"));
    setText("");
    setAdding(false);
    toast.success("Note added", { description: authConfigured() ? undefined : "Preview only. Nothing was stored." });
    router.refresh();
  }

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="type-section">Notes</h2>
        {!adding && (
          <Button variant="ghost" size="touch" className="-mr-3 text-primary" onClick={() => setAdding(true)}>
            <PlusIcon aria-hidden />
            Add a note
          </Button>
        )}
      </div>
      {adding && (
        <div className="mb-4 rounded-2xl bg-muted p-4">
          <label htmlFor="new-note" className="sr-only">
            New note
          </label>
          <Textarea
            id="new-note"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything worth remembering about them"
            rows={3}
            className="min-h-24 rounded-xl bg-background px-3.5 py-2.5 text-base leading-relaxed"
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="touch" className="flex-1" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="touch" className="flex-[2]" disabled={!text.trim() || saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>
      )}
      {notes ? (
        <p className="max-w-[65ch] text-[1.0625rem] leading-relaxed whitespace-pre-line text-pretty">{notes}</p>
      ) : (
        !adding && <p className="text-[0.95rem] text-muted-foreground">No notes yet.</p>
      )}
    </section>
  );
}
