// Mapbox settings shared by the Map screen, the pin mover and the small static
// maps, so they all look alike.
import type { StyleSpecification } from "mapbox-gl";
import { appConfig } from "@/lib/config";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
export const hasMapbox = () => Boolean(MAPBOX_TOKEN);

// A Mapbox Studio style URL to use instead of Mapbox Standard. "blank" draws
// no tiles at all, for tests and working without a connection.
const STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE;

const BLANK: StyleSpecification = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e7ecea" } }],
};

export const usesStandardStyle = !STYLE;

export function mapStyle(): StyleSpecification | string {
  if (STYLE === "blank") return BLANK;
  return STYLE ?? "mapbox://styles/mapbox/standard";
}

// Mapbox Standard: day or night to match the app, without shop and
// restaurant labels competing with the pins.
export function mapConfig(dark: boolean) {
  return STYLE ? undefined : { basemap: { lightPreset: dark ? "night" : "day", showPointOfInterestLabels: false } };
}

export const accentFor = (dark: boolean) => (dark ? appConfig.accent.dark : appConfig.accent.light);

// A still image of one pin, from Mapbox's Static Images API: far cheaper than
// a live map for a picture nobody pans (billed per 1,000 images, with a free
// monthly allowance, instead of a map load each). Classic light and dark
// styles, since Standard isn't served as a static image.
export function staticMapUrl({
  lat,
  lng,
  width,
  height,
  dark,
  zoom = 14,
  token = MAPBOX_TOKEN,
}: {
  lat: number;
  lng: number;
  width: number;
  height: number;
  dark: boolean;
  zoom?: number;
  token?: string;
}) {
  const style = dark ? "dark-v11" : "light-v11";
  const color = accentFor(dark).replace("#", "");
  const at = `${lng.toFixed(5)},${lat.toFixed(5)}`;
  const size = `${Math.min(1280, Math.round(width))}x${Math.min(1280, Math.round(height))}@2x`;
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s+${color}(${at})/${at},${zoom},0/${size}?access_token=${encodeURIComponent(token)}`;
}
