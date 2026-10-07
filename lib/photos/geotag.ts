import type { ExifInfo } from "@/lib/photos/exif";

export type DeviceLocation = { lat: number; lng: number; accuracyM: number };

export type Geotag = {
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  source: "device" | "photo" | "none";
  takenAt: string | null;
};

// How old a photo can be and still count as "just taken in the app".
const FRESH_MS = 2 * 60 * 1000;

type GeotagInput = {
  exif: ExifInfo;
  // Phone GPS right now, if available.
  device: DeviceLocation | null;
  // True when the camera was opened directly (capture="environment").
  fromCamera: boolean;
  // File.lastModified, which phones set to the capture time for new photos.
  lastModified: number;
  now: number;
};

// Decides where and when a photo was taken.
// A photo just taken in the app gets the phone's current GPS. A library photo
// only gets a location if one is saved inside it, because the phone's current
// position says nothing about where an old photo was taken.
export function chooseGeotag({ exif, device, fromCamera, lastModified, now }: GeotagInput): Geotag {
  const fresh = fromCamera || isFresh(exif.takenAt, lastModified, now);
  const fromPhoto = exif.lat !== null && exif.lng !== null;

  if (fresh && device) {
    return {
      lat: device.lat,
      lng: device.lng,
      accuracyM: device.accuracyM,
      source: "device",
      takenAt: new Date(now).toISOString(),
    };
  }
  if (fromPhoto) {
    return { lat: exif.lat, lng: exif.lng, accuracyM: null, source: "photo", takenAt: exif.takenAt };
  }
  return {
    lat: null,
    lng: null,
    accuracyM: null,
    source: "none",
    takenAt: exif.takenAt ?? (fresh ? new Date(now).toISOString() : null),
  };
}

function isFresh(exifTakenAt: string | null, lastModified: number, now: number) {
  if (exifTakenAt) {
    // EXIF times without an offset are local to the camera; compare as local.
    const taken = Date.parse(exifTakenAt);
    return Number.isFinite(taken) && Math.abs(now - taken) <= FRESH_MS;
  }
  return Math.abs(now - lastModified) <= FRESH_MS;
}
