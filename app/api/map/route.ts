// Pins for the map: everyone with coordinates, as GeoJSON, from one endpoint
// (brief 7.7). Only the id, name, date and city go out, never notes.
// Mockup: the sample people. Real build: the signed-in user's people, read
// through their own session so row level security applies; the proxy already
// turns signed-out requests away.
import { peopleToGeoJson } from "@/lib/map/geo";
import { mockPeople } from "@/lib/mock/people";

export function GET() {
  return Response.json(peopleToGeoJson(mockPeople), { headers: { "Cache-Control": "private, no-store" } });
}
