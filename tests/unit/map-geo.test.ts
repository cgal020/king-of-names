import { describe, expect, it } from "vitest";
import { boundsAround, boundsOfRadius, circlePolygon, peopleToGeoJson } from "@/lib/map/geo";
import { mockPeople } from "@/lib/mock/people";
import { distanceKm } from "@/lib/format";

describe("peopleToGeoJson", () => {
  it("sends a pin for everyone with coordinates, and nothing private", () => {
    const pins = peopleToGeoJson(mockPeople);
    const located = mockPeople.filter((p) => p.lat !== null && p.lng !== null);
    expect(pins.features).toHaveLength(located.length);
    const first = pins.features[0];
    expect(first.geometry.coordinates).toEqual([located[0].lng, located[0].lat]);
    expect(Object.keys(first.properties).sort()).toEqual(["city", "id", "initials", "met_at", "name"]);
    expect(JSON.stringify(pins)).not.toContain(located[0].notes ?? "\u0000");
  });

  it("leaves out people with a city but no GPS (they still show in the city list)", () => {
    const noGps = mockPeople.find((p) => p.lat === null && p.city);
    expect(noGps).toBeDefined();
    expect(peopleToGeoJson(mockPeople).features.some((f) => f.properties.id === noGps!.id)).toBe(false);
  });
});

describe("circlePolygon", () => {
  it("draws a closed ring the given distance from the centre", () => {
    const center = { lat: 25.08, lng: 55.14 };
    const ring = circlePolygon(center, 5).geometry.coordinates[0];
    expect(ring[0]).toEqual(ring.at(-1));
    for (const [lng, lat] of ring) expect(distanceKm(center.lat, center.lng, lat, lng)).toBeCloseTo(5, 0);
  });
});

describe("boundsAround and boundsOfRadius", () => {
  it("grows a single place to a minimum span so one pin doesn't zoom to street level", () => {
    expect(boundsAround([{ lat: 25.08, lng: 55.14 }], 0.25)).toEqual({ west: 55.015, east: 55.265, south: 24.955, north: 25.205 });
  });

  it("keeps a wide spread as it is, within the map's limits", () => {
    const b = boundsAround([{ lat: -33.87, lng: 151.21 }, { lat: 13.75, lng: 100.5 }, { lat: 25.2, lng: 55.27 }], 20);
    expect(b).toEqual({ west: 55.27, east: 151.21, south: -33.87, north: 25.2 });
    expect(boundsAround([], 20)).toBeNull();
  });

  it("frames a radius around a point", () => {
    const b = boundsOfRadius({ lat: 25.08, lng: 55.14 }, 5);
    expect(distanceKm(25.08, b.west, 25.08, b.east)).toBeCloseTo(10, 0);
    expect(distanceKm(b.south, 55.14, b.north, 55.14)).toBeCloseTo(10, 0);
  });
});

describe("staticMapUrl", () => {
  it("asks Mapbox for a small light or dark image with one pin in the app's colour", async () => {
    const { staticMapUrl } = await import("@/lib/map/mapbox-style");
    const light = new URL(staticMapUrl({ lat: 25.0805, lng: 55.1403, width: 600, height: 240, dark: false, token: "pk.abc" }));
    expect(light.pathname).toBe("/styles/v1/mapbox/light-v11/static/pin-s+1f4d3d(55.14030,25.08050)/55.14030,25.08050,14,0/600x240@2x");
    expect(light.searchParams.get("access_token")).toBe("pk.abc");
    const dark = staticMapUrl({ lat: 25.0805, lng: 55.1403, width: 2000, height: 240, dark: true, token: "pk.abc" });
    expect(dark).toContain("/dark-v11/static/pin-s+c9a96a(");
    expect(dark).toContain("/1280x240@2x");
  });
});
