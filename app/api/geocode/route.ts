// The place name shown while recording ("Dubai Marina · within 12 m"). It is
// only displayed, so it uses Mapbox's free temporary geocoding; the place that
// is saved is looked up again, permanently, when the note is processed.
// Coordinates travel in the body, never the URL, so they stay out of logs.
// Mockup: development only. Real build: signed-in users only.
import { z } from "zod";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";

const Body = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send lat and lng as numbers." }, { status: 400 });

  try {
    const place = await reverseGeocode(parsed.data.lat, parsed.data.lng, { permanent: false });
    return Response.json({ place: place && { placeName: place.place_name, city: place.city } });
  } catch {
    // No Mapbox token yet, or Mapbox is unreachable: the app shows the accuracy only.
    return Response.json({ place: null });
  }
}
