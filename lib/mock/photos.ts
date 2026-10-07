// Sample photos for the mockup. The cards and scenes are illustrations, not
// real photos; nobody in the sample data has a face photo, so the profile
// pictures you see are ones you add while trying the mockup.
import type { Photo } from "@/lib/types";
import { distanceKm } from "@/lib/format";
import { mockCurrentLocation, mockPeople } from "@/lib/mock/people";

function photo(p: Partial<Photo> & Pick<Photo, "id" | "kind" | "url">): Photo {
  return {
    person_id: null,
    capture_id: null,
    width: 1200,
    height: 900,
    taken_at: null,
    taken_timezone: null,
    lat: null,
    lng: null,
    location_accuracy_m: null,
    location_source: "none",
    place_label: null,
    ...p,
  };
}

export const mockPhotos: Photo[] = [
  photo({
    id: "ph-zayed-card",
    person_id: "zayed-khoury",
    kind: "card",
    url: "/mock/photos/card-zayed.svg",
    taken_at: "2026-10-04T19:44:00+04:00",
    taken_timezone: "Asia/Dubai",
    lat: 25.1424, lng: 55.2259, location_accuracy_m: 14,
    location_source: "device",
    place_label: "Alserkal Avenue, Dubai",
  }),
  photo({
    id: "ph-zayed-moment",
    person_id: "zayed-khoury",
    kind: "moment",
    url: "/mock/photos/moment-gallery.svg",
    taken_at: "2026-10-04T19:51:00+04:00",
    taken_timezone: "Asia/Dubai",
    lat: 25.1426, lng: 55.2262, location_accuracy_m: 11,
    location_source: "device",
    place_label: "Alserkal Avenue, Dubai",
  }),
  photo({
    id: "ph-priya-card",
    person_id: "priya-raman",
    kind: "card",
    url: "/mock/photos/card-priya.svg",
    taken_at: "2026-09-28T21:20:00+04:00",
    taken_timezone: "Asia/Dubai",
    lat: 25.0805, lng: 55.1403, location_accuracy_m: 9,
    location_source: "device",
    place_label: "Dubai Marina, Dubai",
  }),
  photo({
    id: "ph-lachlan-moment",
    person_id: "lachlan-brooks",
    kind: "moment",
    url: "/mock/photos/moment-beach.svg",
    // Picked from the library; its location came from inside the photo.
    taken_at: "2026-08-16T07:58:00+10:00",
    taken_timezone: "Australia/Sydney",
    lat: -33.8908, lng: 151.2743,
    location_source: "photo",
    place_label: "Bondi Beach, Sydney",
  }),
  photo({
    id: "ph-kenji-card",
    person_id: "kenji-watanabe",
    kind: "card",
    url: "/mock/photos/card-kenji.svg",
    // Library photo with location stripped by the phone.
    taken_at: null,
    taken_timezone: null,
    location_source: "none",
  }),
];

// Mockup stand-in for reverse geocoding: names a point after the nearest
// sample place within 3 km, or its city within 40 km.
export function mockPlaceLabel(lat: number, lng: number) {
  const known = [
    { lat: mockCurrentLocation.lat, lng: mockCurrentLocation.lng, label: `${mockCurrentLocation.placeName}, ${mockCurrentLocation.city}` },
    ...mockPeople
      .filter((p) => p.lat !== null && p.lng !== null)
      .map((p) => ({ lat: p.lat!, lng: p.lng!, label: [p.place_name, p.city].filter(Boolean).join(", "), city: p.city })),
  ];
  const nearest = known
    .map((k) => ({ ...k, km: distanceKm(lat, lng, k.lat, k.lng) }))
    .sort((a, b) => a.km - b.km)[0];
  if (nearest && nearest.km <= 3) return nearest.label;
  if (nearest && nearest.km <= 40) return nearest.label.split(", ").at(-1) ?? null;
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}
