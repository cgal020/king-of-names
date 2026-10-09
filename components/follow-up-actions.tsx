"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setFollowUp } from "@/app/actions/people";
import { authConfigured } from "@/lib/auth/config";
import { snoozedDate } from "@/lib/upcoming";

type FollowUp = { id: string; full_name: string; follow_up_note: string | null; follow_up_date: string | null };

// Done and Snooze for a follow-up, each with Undo. Shared by Coming up and
// the profile.
export function useFollowUpActions(onChange?: (id: string, gone: boolean) => void) {
  const router = useRouter();

  async function change(person: FollowUp, next: { note: string | null; date: string | null }, message: string) {
    const before = { note: person.follow_up_note, date: person.follow_up_date };
    onChange?.(person.id, true);
    const result = await setFollowUp(person.id, next).catch(() => ({ ok: false }));
    if (!result.ok) {
      onChange?.(person.id, false);
      toast.error("That didn’t save", { description: "Check your connection and try again." });
      return;
    }
    router.refresh();
    toast.success(message, {
      description: authConfigured() ? undefined : "Preview only. Nothing was stored.",
      action: {
        label: "Undo",
        onClick: () => {
          onChange?.(person.id, false);
          void setFollowUp(person.id, before).then(() => router.refresh());
        },
      },
    });
  }

  return {
    done: (person: FollowUp) => change(person, { note: null, date: null }, `Follow-up with ${person.full_name} done`),
    snooze: (person: FollowUp) =>
      change(person, { note: person.follow_up_note, date: snoozedDate(new Date()) }, `Snoozed until next week`),
  };
}
