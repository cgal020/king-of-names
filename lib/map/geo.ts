// Shapes for the map: pins as GeoJSON, the Near me circle, and the area a
// camera move should show. Pure, so the stand-in map and Mapbox share them.
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { Person } from "@/lib/types";
import { initials } from "@/lib/initials";

export type LatLng = { lat: number; lng: number };
export type PinProperties = { id: string; name: string; initials: string; met_at: string; city: string | null };
export type PinCollection = FeatureCollection<Point, PinProperties>;

// Only what a pin and its card need, so the map endpoint never sends notes.
export function peopleToGeoJson(people: Person[]): PinCollection {
  return {
    type: "FeatureCollection",
    features: people
      .filter((p) => p.lat !== null && p.lng !== null)
      .map((p) => ({
        type: "Feature",
        id: p.id,
        geometry: { type: "Point", coordinates: [p.lng!, p.lat!] },
        properties: { id: p.id, name: p.full_name, initials: initials(p.full_name), met_at: p.met_at, city: p.city },
      })),
  };
}

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

// A ring around a point, for the Near me radius on a real map.
export function circlePolygon(center: LatLng, radiusKm: number, steps = 64): Feature<Polygon> {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([
      center.lng + (radiusKm * Math.cos(angle)) / kmPerDegLng(center.lat),
      center.lat + (radiusKm * Math.sin(angle)) / KM_PER_DEG_LAT,
    ]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

export type Bounds = { west: number; south: number; east: number; north: number };

// The box around some places, grown to at least `minSpanDeg` on each side so
// one person or one city doesn't zoom all the way in.
export function boundsAround(points: LatLng[], minSpanDeg: number): Bounds | null {
  if (!points.length) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let [south, north, west, east] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const grow = (lo: number, hi: number) => {
    const extra = Math.max(0, minSpanDeg - (hi - lo)) / 2;
    return [lo - extra, hi + extra];
  };
  [south, north] = grow(south, north);
  [west, east] = grow(west, east);
  return {
    west: Math.max(-180, west),
    east: Math.min(180, east),
    south: Math.max(-85, south),
    north: Math.min(85, north),
  };
}

// The box that just holds a circle of radiusKm around a point.
export function boundsOfRadius(center: LatLng, radiusKm: number): Bounds {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLng = radiusKm / kmPerDegLng(center.lat);
  return { west: center.lng - dLng, east: center.lng + dLng, south: center.lat - dLat, north: center.lat + dLat };
}
