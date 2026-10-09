import { MapPinOffIcon } from "lucide-react";
import { hasMapbox, staticMapUrl } from "@/lib/map/mapbox-style";
import { WORLD_LAND_PATH } from "@/lib/mock/world-path";
import { cn } from "@/lib/utils";

const WIDTH = 716;
const HEIGHT = 280;

// Small map with one pin, on Review and profiles. With a Mapbox token it's a
// still image (a live map here would be a billed load per view); without one,
// a drawn stand-in.
export function MiniMap({ lat, lng, className }: { lat: number | null; lng: number | null; className?: string }) {
  if (lat === null || lng === null) {
    return (
      <div className={cn("grid h-35 place-items-center rounded-[18px] bg-muted text-sm text-muted-foreground", className)}>
        <span className="flex items-center gap-2">
          <MapPinOffIcon className="size-4" aria-hidden />
          No GPS location recorded
        </span>
      </div>
    );
  }

  if (hasMapbox()) {
    const url = (dark: boolean) => staticMapUrl({ lat, lng, width: WIDTH, height: HEIGHT, dark });
    return (
      <picture className={cn("block h-35 overflow-hidden rounded-[18px] bg-muted", className)}>
        <source media="(prefers-color-scheme: dark)" srcSet={url(true)} />
        {/* A plain img: next/image would proxy the Mapbox image through the server. */}
        <img src={url(false)} alt="Map of where you met" width={WIDTH} height={HEIGHT} loading="lazy" className="size-full object-cover" />
      </picture>
    );
  }

  const x = lng + 180;
  const y = 90 - lat;
  const width = 1.6;
  const height = 0.6;

  return (
    <div
      className={cn(
        "relative h-35 overflow-hidden rounded-[18px] bg-[color-mix(in_oklch,var(--primary)_7%,var(--muted))]",
        className,
      )}
    >
      <svg viewBox={`${x - width / 2} ${y - height / 2} ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <path d={WORLD_LAND_PATH} className="fill-card" />
      </svg>
      <span
        className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-primary shadow-md"
        aria-hidden
      />
    </div>
  );
}
