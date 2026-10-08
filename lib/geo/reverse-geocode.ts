import "server-only";
import { parseReverseGeocode, reverseGeocodeUrl, type Place } from "@/lib/geo/mapbox";

export class GeocodeError extends Error {}

// Coordinates to place, city, region and country. Permanent by default,
// because the pipeline stores the result. The URL carries the server token,
// so never log it.
export async function reverseGeocode(lat: number, lng: number, { permanent = true } = {}): Promise<Place | null> {
  const token = process.env.MAPBOX_SERVER_TOKEN;
  if (!token) throw new GeocodeError("MAPBOX_SERVER_TOKEN is not set");

  const response = await fetch(reverseGeocodeUrl(lat, lng, token, { permanent }), { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new GeocodeError(`Mapbox returned ${response.status}`);
  return parseReverseGeocode(await response.json());
}
