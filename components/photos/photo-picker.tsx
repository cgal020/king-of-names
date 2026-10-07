"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePhotos } from "@/components/photos/photo-store";
import { mockCurrentLocation } from "@/lib/mock/people";
import { mockPlaceLabel } from "@/lib/mock/photos";
import { chooseGeotag } from "@/lib/photos/geotag";
import { preparePhoto } from "@/lib/photos/prepare";
import type { Photo, PhotoKind } from "@/lib/types";

type PickerTarget = {
  personId?: string | null;
  captureId?: string | null;
  kind: PhotoKind;
  // Opens the camera directly instead of offering camera or library.
  camera?: boolean;
};

// Hidden file input plus the logic to turn picked files into geotagged photos.
// Mockup: the phone's location is the sample "current location" and photos
// stay in memory; the real app uploads to the private photos bucket.
export function usePhotoPicker() {
  const { add } = usePhotos();
  const inputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<PickerTarget | null>(null);
  const [busy, setBusy] = useState(false);

  function open(target: PickerTarget) {
    const input = inputRef.current;
    if (!input) return;
    targetRef.current = target;
    if (target.camera) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  }

  async function handleFiles(files: FileList | null) {
    const target = targetRef.current;
    if (!files?.length || !target) return;
    setBusy(true);
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        const prepared = await preparePhoto(file);
        const geotag = chooseGeotag({
          exif: prepared.exif,
          device: { lat: mockCurrentLocation.lat, lng: mockCurrentLocation.lng, accuracyM: mockCurrentLocation.accuracy },
          fromCamera: Boolean(target.camera),
          lastModified: file.lastModified,
          now: Date.now(),
        });
        added.push({
          id: crypto.randomUUID(),
          person_id: target.personId ?? null,
          capture_id: target.captureId ?? null,
          kind: target.kind,
          url: URL.createObjectURL(prepared.blob),
          width: prepared.width,
          height: prepared.height,
          taken_at: geotag.takenAt,
          // A time read from EXIF is already local to where it was taken;
          // a "taken now" time is shown in the phone's zone.
          taken_timezone:
            geotag.takenAt && geotag.takenAt !== prepared.exif.takenAt
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : null,
          lat: geotag.lat,
          lng: geotag.lng,
          location_accuracy_m: geotag.accuracyM,
          location_source: geotag.source,
          place_label: geotag.lat !== null && geotag.lng !== null ? mockPlaceLabel(geotag.lat, geotag.lng) : null,
        });
      } catch {
        toast.error("Couldn't add that photo", { description: "Try another one, or take it again." });
      }
    }
    if (added.length) {
      add(added);
      const where = added[0].place_label;
      toast.success(added.length === 1 ? "Photo added" : `${added.length} photos added`, {
        description: where ? `Tagged at ${where}` : "No location saved in this photo",
      });
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => handleFiles(e.target.files)}
    />
  );

  return { open, busy, input };
}
