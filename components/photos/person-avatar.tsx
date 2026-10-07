"use client";

import { useAvatar } from "@/components/photos/photo-store";
import { cn } from "@/lib/utils";

// First letters of the first and last name: "Siriporn “Nok” Srisawat" -> "SS".
export function initials(name: string) {
  const words = name
    .replace(/[“”"'()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? Array.from(words.at(-1)!)[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function PersonAvatar({
  personId,
  name,
  size = 44,
  className,
}: {
  personId: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const photo = useAvatar(personId);
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs and object URLs, not optimizable
        <img src={photo.url} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
