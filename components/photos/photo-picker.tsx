"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePhotos } from "@/components/photos/photo-store";
import { authConfigured } from "@/lib/auth/config";
import { locateOnce, type LocateResult } from "@/lib/geo/locate";
import { mockPlaceLabel } from "@/lib/mock/photos";
import { chooseGeotag, isFresh } from "@/lib/photos/geotag";
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
// The location is asked for only when a photo was just taken. The photo store
// uploads them to the private photos bucket (the preview keeps them in memory).
export function usePhotoPicker() {
  const { add } = usePhotos();
  const inputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<PickerTarget | null>(null);
  // Started when the camera opens, so the fix is ready when the photo is.
  const locating = useRef<Promise<LocateResult> | null>(null);
  const [busy, setBusy] = useState(false);

  function open(target: PickerTarget) {
    const input = inputRef.current;
    if (!input) return;
    targetRef.current = target;
    if (target.camera) {
      input.setAttribute("capture", "environment");
      locating.current = locateOnce();
    } else {
      input.removeAttribute("capture");
      locating.current = null;
    }
    input.click();
  }

  async function handleFiles(files: FileList | null) {
    const target = targetRef.current;
    if (!files?.length || !target) return;
    setBusy(true);
    const added: Photo[] = [];
    const picked = new Map<string, Blob>();
    for (const file of Array.from(files)) {
      try {
        const prepared = await preparePhoto(file);
        const now = Date.now();
        const justTaken = Boolean(target.camera) || isFresh(prepared.exif.takenAt, file.lastModified, now);
        const located = justTaken ? await (locating.current ??= locateOnce()) : null;
        const geotag = chooseGeotag({
          exif: prepared.exif,
          device: located?.ok ? located.fix : null,
          fromCamera: Boolean(target.camera),
          lastModified: file.lastModified,
          now,
        });
        const id = crypto.randomUUID();
        picked.set(id, prepared.blob);
        added.push({
          id,
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
          // The place is looked up on the server when the photo is saved.
          place_label:
            geotag.lat !== null && geotag.lng !== null && !authConfigured() ? mockPlaceLabel(geotag.lat, geotag.lng) : null,
        });
      } catch {
        toast.error("Couldn't add that photo", { description: "Try another one, or take it again." });
      }
    }
    if (added.length) {
      add(added, picked);
      const where = added[0].place_label;
      const located = added[0].lat !== null;
      toast.success(added.length === 1 ? "Photo added" : `${added.length} photos added`, {
        description: where ? `Tagged at ${where}` : located ? "Tagged with where it was taken" : "No location saved in this photo",
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
