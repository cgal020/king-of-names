"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import mapboxgl, { type GeoJSONSource, type Map as MapboxMap, type StyleSpecification } from "mapbox-gl";
import type { CameraRequest, SurfaceProps } from "@/components/map/surface";
import { appConfig } from "@/lib/config";
import { boundsAround, boundsOfRadius, circlePolygon } from "@/lib/map/geo";

// The real map (brief 7.7): Mapbox GL with clustered pins loaded as GeoJSON
// from /api/map. Each new map is a billed "map load", so one map is made per
// session and moved between visits to the Map screen instead of re-created.

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
// A Mapbox Studio style URL to use instead of Mapbox Standard. "blank" draws no
// tiles at all, for tests and working without a connection.
const STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE;

const BLANK: StyleSpecification = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e7ecea" } }],
};

const PEOPLE_LAYERS = ["clusters", "people"];

type Overlay = Pick<SurfaceProps, "selectedId" | "near">;
type Handlers = Pick<SurfaceProps, "onSelectPerson" | "onBackground">;

let shared: { map: MapboxMap; container: HTMLDivElement } | null = null;
let handlers: Handlers | null = null;
let overlay: Overlay = { selectedId: null, near: null };

const dark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const accent = () => (dark() ? appConfig.accent.dark : appConfig.accent.light);
const ink = () => (dark() ? "#0c0c0b" : "#ffffff");
const pinsUrl = () => new URL("/api/map", window.location.origin).href;
const empty = { type: "FeatureCollection" as const, features: [] };

function addOverlays(map: MapboxMap) {
  if (map.getSource("people")) return;
  map.addSource("people", { type: "geojson", data: pinsUrl(), cluster: true, clusterRadius: 44, clusterMaxZoom: 14 });
  map.addSource("near-area", { type: "geojson", data: empty });
  map.addSource("here", { type: "geojson", data: empty });

  map.addLayer({ id: "near-fill", type: "fill", source: "near-area", paint: { "fill-color": accent(), "fill-opacity": 0.1 } });
  map.addLayer({ id: "near-line", type: "line", source: "near-area", paint: { "line-color": accent(), "line-opacity": 0.45, "line-width": 1.5 } });
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "people",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": accent(),
      "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
      "circle-stroke-width": 2,
      "circle-stroke-color": ink(),
    },
  });
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "people",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"] },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: "people",
    type: "circle",
    source: "people",
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-color": accent(), "circle-radius": 7, "circle-stroke-width": 2.5, "circle-stroke-color": ink() },
  });
  map.addLayer({
    id: "person-selected",
    type: "circle",
    source: "people",
    filter: ["==", ["get", "id"], ""],
    paint: { "circle-color": accent(), "circle-radius": 11, "circle-stroke-width": 3, "circle-stroke-color": ink() },
  });
  map.addLayer({
    id: "person-selected-name",
    type: "symbol",
    source: "people",
    filter: ["==", ["get", "id"], ""],
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
      "text-offset": [0, -1.6],
      "text-anchor": "bottom",
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
    },
    paint: { "text-color": dark() ? "#ffffff" : "#17201d", "text-halo-color": ink(), "text-halo-width": 1.5 },
  });
  map.addLayer({
    id: "here",
    type: "circle",
    source: "here",
    paint: { "circle-color": dark() ? "#ffffff" : "#17201d", "circle-radius": 6, "circle-stroke-width": 3, "circle-stroke-color": ink() },
  });
  applyOverlay(map);
}

function applyOverlay(map: MapboxMap) {
  if (!map.getSource("people")) return;
  const id = overlay.selectedId ?? "";
  map.setFilter("person-selected", ["==", ["get", "id"], id]);
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
  mapboxgl.accessToken = TOKEN;
  const map = new mapboxgl.Map({
    container,
    style: STYLE === "blank" ? BLANK : (STYLE ?? "mapbox://styles/mapbox/standard"),
    // Mapbox Standard: day or night to match the app, without shop and
    // restaurant labels competing with the pins.
    config: STYLE ? undefined : { basemap: { lightPreset: dark() ? "night" : "day", showPointOfInterestLabels: false } },
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
  map.on("click", "people", (e) => {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id === "string") handlers?.onSelectPerson(id);
  });
  map.on("click", (e) => {
    if (!map.queryRenderedFeatures(e.point, { layers: PEOPLE_LAYERS }).length) handlers?.onBackground();
  });
  for (const layer of PEOPLE_LAYERS) {
    map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
  }

  // Follow the phone's light or dark mode.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!STYLE) map.setConfigProperty("basemap", "lightPreset", dark() ? "night" : "day");
    if (!map.getSource("people")) return;
    for (const layer of ["clusters", "people", "person-selected"]) {
      map.setPaintProperty(layer, "circle-color", accent());
      map.setPaintProperty(layer, "circle-stroke-color", ink());
    }
    map.setPaintProperty("near-fill", "fill-color", accent());
    map.setPaintProperty("near-line", "line-color", accent());
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
