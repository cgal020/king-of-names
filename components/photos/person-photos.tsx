"use client";

import { PhotoStrip } from "@/components/photos/photo-strip";
import { usePhotosFor } from "@/components/photos/photo-store";

export function PersonPhotos({ personId }: { personId: string }) {
  const photos = usePhotosFor({ personId });
  return <PhotoStrip photos={photos} target={{ personId }} />;
}
