"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteAccount, signOut } from "@/app/actions/auth";
import { useCaptureQueue } from "@/components/capture/capture-queue";
import { eventActions } from "@/components/capture/event-store";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";

// Everything this app keeps on the phone: the offline copy of the app, notes
// waiting to send, the running event, and small settings. Signing out leaves
// nothing behind for the next person to use this phone.
async function clearThisPhone() {
  eventActions.close();
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("king-of-names:")) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing was saved there either.
  }
  await Promise.all([
    "caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) : null,
    new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("king-of-names");
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    }),
  ]);
}

export function AccountActions() {
  const router = useRouter();
  const queue = useCaptureQueue();
  const [pending, startTransition] = useTransition();
  const unsent = queue.waiting + queue.rejected.length;

  const leave = () =>
    startTransition(async () => {
      await clearThisPhone();
      await signOut();
    });

  const remove = () =>
    startTransition(async () => {
      const outcome = await deleteAccount();
      if ("error" in outcome) {
        toast.error(outcome.error);
        return;
      }
      if (outcome.result === "preview") {
        toast("Account deleted", { description: "Preview only. Nothing was removed." });
        return;
      }
      await clearThisPhone();
      router.replace("/login?deleted=1");
    });

  return (
    <div className="flex flex-col gap-2">
      {unsent > 0 ? (
        <ConfirmButton
          label="Sign out"
          title="Sign out with unsent notes?"
          description={`${unsent === 1 ? "1 note hasn’t" : `${unsent} notes haven’t`} been sent yet. Signing out deletes ${unsent === 1 ? "it" : "them"} from this phone.`}
          confirmLabel="Sign out anyway"
          className="w-full"
          onConfirm={leave}
        />
      ) : (
        <Button variant="outline" size="touch-lg" className="w-full" disabled={pending} onClick={leave}>
          {pending ? "Signing out…" : "Sign out"}
        </Button>
      )}
      <ConfirmButton
        label="Delete my account"
        title="Delete your account?"
        description="Every person, note, recording and photo will be permanently deleted. Export first if you want a copy."
        confirmLabel="Delete everything"
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onConfirm={remove}
      />
    </div>
  );
}
