"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import mapboxgl, { type GeoJSONSource, type Map as MapboxMap } from "mapbox-gl";
import type { CameraRequest, SurfaceProps } from "@/components/map/surface";
import { boundsAround, boundsOfRadius, circlePolygon } from "@/lib/map/geo";
import { MAPBOX_TOKEN, mapColors, mapConfig, mapStyle, usesStandardStyle } from "@/lib/map/mapbox-style";

// The real map (brief 7.7): Mapbox GL with clustered pins loaded as GeoJSON
// from /api/map. Each new map is a billed "map load", so one map is made per
// session and moved between visits to the Map screen instead of re-created.

// The ring counts as part of a pin, so the whole 36px circle can be tapped.
const PEOPLE_LAYERS = ["clusters", "people", "people-ring"];

type Overlay = Pick<SurfaceProps, "selectedId" | "near">;
type Handlers = Pick<SurfaceProps, "onSelectPerson" | "onBackground">;

let shared: { map: MapboxMap; container: HTMLDivElement } | null = null;
let handlers: Handlers | null = null;
let overlay: Overlay = { selectedId: null, near: null };

const dark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const colors = () => mapColors(dark());
const pinsUrl = () => new URL("/api/map", window.location.origin).href;
const empty = { type: "FeatureCollection" as const, features: [] };
const LABEL_FONT = ["DIN Pro Bold", "Arial Unicode MS Bold"];

// Colours that follow light and dark mode, per layer and paint property.
function themePaint(): [string, string, unknown][] {
  const c = colors();
  return [
    ["near-fill", "fill-color", c.primary],
    ["near-line", "line-color", c.primary],
    ["clusters", "circle-color", c.primary],
    ["clusters", "circle-stroke-color", c.background],
    ["cluster-count", "text-color", c.onPrimary],
    ["people-ring", "circle-color", c.background],
    ["people", "circle-color", c.card],
    ["people", "circle-stroke-color", c.primary],
    ["people-initials", "text-color", c.foreground],
    ["person-selected", "circle-color", c.primary],
    ["person-selected", "circle-stroke-color", c.background],
    ["person-selected-initials", "text-color", c.onPrimary],
    ["person-selected-name", "text-color", c.background],
    ["person-selected-name", "text-halo-color", c.foreground],
    ["here", "circle-color", c.primary],
    ["here", "circle-stroke-color", c.background],
  ];
}

function addOverlays(map: MapboxMap) {
  if (map.getSource("people")) return;
  const c = colors();
  map.addSource("people", { type: "geojson", data: pinsUrl(), cluster: true, clusterRadius: 44, clusterMaxZoom: 14 });
  map.addSource("near-area", { type: "geojson", data: empty });
  map.addSource("here", { type: "geojson", data: empty });

  // Near me: primary at 7% with a 1.5px line at 55%.
  map.addLayer({ id: "near-fill", type: "fill", source: "near-area", paint: { "fill-color": c.primary, "fill-opacity": 0.07 } });
  map.addLayer({ id: "near-line", type: "line", source: "near-area", paint: { "line-color": c.primary, "line-opacity": 0.55, "line-width": 1.5 } });
  // City clusters: 32 + 6·√count across, 32–64px, with a 3px ring in the background colour.
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "people",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": c.primary,
      "circle-radius": ["min", 32, ["+", 16, ["*", 3, ["sqrt", ["get", "point_count"]]]]],
      "circle-stroke-width": 3,
      "circle-stroke-color": c.background,
    },
  });
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "people",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": LABEL_FONT },
    paint: { "text-color": c.onPrimary },
  });
  // A person: 32px, card fill with initials, a 2px primary ring and a 2px ring in the background colour.
  map.addLayer({
    id: "people-ring",
    type: "circle",
    source: "people",
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-color": c.background, "circle-radius": 18 },
  });
  map.addLayer({
    id: "people",
    type: "circle",
    source: "people",
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-color": c.card, "circle-radius": 14, "circle-stroke-width": 2, "circle-stroke-color": c.primary },
  });
  map.addLayer({
    id: "people-initials",
    type: "symbol",
    source: "people",
    filter: ["!", ["has", "point_count"]],
    layout: { "text-field": ["get", "initials"], "text-size": 11, "text-font": LABEL_FONT, "text-allow-overlap": true },
    paint: { "text-color": c.foreground },
  });
  // The chosen person: 44px in primary, with the name above.
  map.addLayer({
    id: "person-selected",
    type: "circle",
    source: "people",
    filter: ["==", ["get", "id"], ""],
    paint: { "circle-color": c.primary, "circle-radius": 22, "circle-stroke-width": 2, "circle-stroke-color": c.background },
  });
  map.addLayer({
    id: "person-selected-initials",
    type: "symbol",
    source: "people",
    filter: ["==", ["get", "id"], ""],
    layout: { "text-field": ["get", "initials"], "text-size": 13, "text-font": LABEL_FONT, "text-allow-overlap": true },
    paint: { "text-color": c.onPrimary },
  });
  map.addLayer({
    id: "person-selected-name",
    type: "symbol",
    source: "people",
    filter: ["==", ["get", "id"], ""],
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
      "text-offset": [0, -2.4],
      "text-anchor": "bottom",
      "text-font": LABEL_FONT,
      "text-allow-overlap": true,
    },
    paint: { "text-color": c.background, "text-halo-color": c.foreground, "text-halo-width": 4 },
  });
  // You: a 14px dot.
  map.addLayer({
    id: "here",
    type: "circle",
    source: "here",
    paint: { "circle-color": c.primary, "circle-radius": 7, "circle-stroke-width": 3, "circle-stroke-color": c.background },
  });
  applyOverlay(map);
}

function applyOverlay(map: MapboxMap) {
  if (!map.getSource("people")) return;
  const id = overlay.selectedId ?? "";
  map.setFilter("person-selected", ["==", ["get", "id"], id]);
  map.setFilter("person-selected-initials", ["==", ["get", "id"], id]);
  map.setFilter("person-selected-name", ["==", ["get", "id"], id]);
  const near = overlay.near;
  (map.getSource("near-area") as GeoJSONSource).setData(
    near ? { type: "FeatureCollection", features: [circlePolygon(near.center, near.radiusKm)] } : empty,
  );
  (map.getSource("here") as GeoJSONSource).setData(
    near
      ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [near.center.lng, near.center.lat] } }] }
      : empty,
  );
}

function moveCamera(map: MapboxMap, { target }: CameraRequest, animate: boolean) {
  const b = target.kind === "fit" ? boundsAround(target.points, target.minSpanDeg) : boundsOfRadius(target.center, target.radiusKm * 1.15);
  if (!b) return;
  const still = !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  map.fitBounds(
    [
      [b.west, b.south],
      [b.east, b.north],
    ],
    { padding: 48, maxZoom: 15, duration: still ? 0 : 900 },
  );
}

function createMap() {
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;inset:0";
  mapboxgl.accessToken = MAPBOX_TOKEN;
  const map = new mapboxgl.Map({
    container,
    style: mapStyle(),
    config: mapConfig(dark()),
    center: [55.2, 25.1],
    zoom: 1.5,
    attributionControl: true,
  });
  map.on("style.load", () => addOverlays(map));

  // Clusters zoom in; pins open their card; anywhere else closes it.
  map.on("click", "clusters", (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const center = feature.geometry.coordinates as [number, number];
    (map.getSource("people") as GeoJSONSource).getClusterExpansionZoom(feature.properties?.cluster_id, (error, zoom) => {
      if (!error && zoom != null) map.easeTo({ center, zoom });
    });
  });
  for (const layer of ["people", "people-ring"]) {
    map.on("click", layer, (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") handlers?.onSelectPerson(id);
    });
  }
  map.on("click", (e) => {
    if (!map.queryRenderedFeatures(e.point, { layers: PEOPLE_LAYERS }).length) handlers?.onBackground();
  });
  for (const layer of PEOPLE_LAYERS) {
    map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
  }

  // Follow the phone's light or dark mode.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (usesStandardStyle) map.setConfigProperty("basemap", "lightPreset", dark() ? "night" : "day");
    if (!map.getSource("people")) return;
    for (const [layer, property, value] of themePaint()) map.setPaintProperty(layer, property as never, value as never);
  });

  if (process.env.NODE_ENV !== "production") (window as unknown as { __kingMap?: MapboxMap }).__kingMap = map;
  return { map, container };
}

export default function MapboxSurface({ selectedId, near, camera, onSelectPerson, onBackground }: SurfaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const firstCamera = useRef(true);

  // The shared map's listeners call whichever Map screen is showing now.
  useEffect(() => {
    handlers = { onSelectPerson, onBackground };
  });

  // Borrow the session's map; put it back (still alive) on the way out.
  useEffect(() => {
    shared ??= createMap();
    const { map, container } = shared;
    hostRef.current?.appendChild(container);
    map.resize();
    // People may have been added or changed since the last visit.
    (map.getSource("people") as GeoJSONSource | undefined)?.setData(pinsUrl());
    return () => {
      container.remove();
      handlers = null;
    };
  }, []);

  const nearKey = near ? `${near.center.lat},${near.center.lng},${near.radiusKm}` : "";
  useEffect(() => {
    overlay = { selectedId, near };
    if (shared) applyOverlay(shared.map);
    // near is compared by value through nearKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, nearKey]);

  useEffect(() => {
    if (!shared) return;
    moveCamera(shared.map, camera, !firstCamera.current);
    firstCamera.current = false;
  }, [camera]);

  return <div ref={hostRef} className="absolute inset-0" aria-label="Map of where you met people" role="region" />;
}
