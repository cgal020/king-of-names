// Pins for the map: everyone with coordinates, as GeoJSON, from one endpoint
// (brief 7.7). Only the id, name, initials, date and city go out, never notes.
// The signed-in user's people, read through their own session so row level
// security applies; the proxy already turns signed-out requests away. The
// preview serves the sample people.
import { listPeople } from "@/lib/data/people";
import { peopleToGeoJson } from "@/lib/map/geo";

export async function GET() {
  try {
    return Response.json(peopleToGeoJson(await listPeople()), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Couldn’t load the map." }, { status: 503 });
  }
}
