"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deletePerson } from "@/app/actions/people";
import { ConfirmButton } from "@/components/confirm-button";
import { authConfigured } from "@/lib/auth/config";

export function DeletePersonButton({ personId, name }: { personId: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={`Delete ${name.split(" ")[0]}`}
      title={`Delete ${name}?`}
      description="Their profile, notes, photos and recordings will be deleted. This can't be undone."
      confirmLabel="Delete"
      variant="ghost"
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
      onConfirm={async () => {
        const result = await deletePerson(personId).catch(() => ({ ok: false, error: "That didn’t delete. Check your connection and try again." }));
        if (!result.ok) {
          toast.error(result.error ?? "That didn’t delete.");
          return;
        }
        toast(`Deleted ${name}`, { description: authConfigured() ? undefined : "Preview only. Nothing was removed." });
        router.push("/people");
      }}
    />
  );
}
