"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/confirm-button";

export function DeletePersonButton({ name }: { name: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      label={`Delete ${name.split(" ")[0]}`}
      title={`Delete ${name}?`}
      description="Their profile, notes and original recording will be deleted. This can't be undone."
      confirmLabel="Delete"
      variant="ghost"
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
      onConfirm={() => {
        toast(`Deleted ${name}`, { description: "Preview only. Nothing was removed." });
        router.push("/people");
      }}
    />
  );
}
