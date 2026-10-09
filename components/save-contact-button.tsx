"use client";

import { toast } from "sonner";
import { ContactRoundIcon } from "lucide-react";
import { useAvatar } from "@/components/photos/photo-store";
import { Button } from "@/components/ui/button";
import { toVCard, vcardFileName } from "@/lib/contacts/vcard";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function jpegBase64(url: string) {
  const blob = await fetch(url).then((r) => r.blob());
  if (blob.type !== "image/jpeg") return undefined;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// Saves the person to the phone's contacts as a .vcf, with where and when
// you met in the note and their photo when there is one.
// `short` labels it just "Save", for a row of four buttons on a phone.
export function SaveContactButton({ person, className, short = false }: { person: Person; className?: string; short?: boolean }) {
  const avatar = useAvatar(person.id);

  async function save() {
    const photo = avatar ? await jpegBase64(avatar.url).catch(() => undefined) : undefined;
    const name = vcardFileName(person.full_name);
    const file = new File([toVCard(person, photo)], name, { type: "text/vcard" });

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      toast.error("Couldn't create the contact file");
      return;
    }

    // iOS's contact sheet throws the contact away if you tap Done.
    if (isIos()) {
      toast("Almost there", { description: "Scroll down and tap “Create New Contact”. Tapping Done discards it." });
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={save}
      aria-label={short ? "Save contact" : undefined}
      className={cn("h-16 flex-col gap-1 rounded-xl bg-muted text-[0.8125rem] text-primary [&_svg:not([class*='size-'])]:size-4.5", className)}
    >
      <ContactRoundIcon aria-hidden strokeWidth={1.9} />
      {short ? "Save" : "Save contact"}
    </Button>
  );
}
