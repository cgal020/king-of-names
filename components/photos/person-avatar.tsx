"use client";

import { useAvatar } from "@/components/photos/photo-store";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/initials";

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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground",
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
