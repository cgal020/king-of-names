// What the Map screen asks of the map underneath its panel. Two surfaces meet
// it: the real Mapbox map when a public token is set, and the drawn stand-in
// otherwise, so the screen and its panels don't care which one is showing.
import type { LatLng } from "@/lib/map/geo";
import type { Person } from "@/lib/types";

export type CityEntry = {
  city: string;
  country: string | null;
  people: Person[];
  center?: LatLng | null;
};

export type CameraTarget =
  // Show these places, at least minSpanDeg across, so one pin doesn't zoom to street level.
  | { kind: "fit"; points: LatLng[]; minSpanDeg: number }
  // Show a circle of radiusKm around a point.
  | { kind: "near"; center: LatLng; radiusKm: number };

// A new id asks for a new camera move, even to the same place.
export type CameraRequest = { id: number; target: CameraTarget };

export type SurfaceProps = {
  people: (Person & LatLng)[];
  cities: CityEntry[];
  selectedId: string | null;
  near: { center: LatLng; radiusKm: number } | null;
  camera: CameraRequest;
  onSelectPerson: (id: string) => void;
  onSelectCity: (city: string) => void;
  // A tap on the map itself, away from any pin.
  onBackground: () => void;
};
