// Turns a Mapbox Geocoding v6 reverse response into the place fields we store.
// v6 has no venues (POIs), so the place is the neighbourhood or street; the
// venue comes from what the user said ("the rooftop bar at Soho House").

export type Place = {
  place_name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
};

type Named = { name?: string; country_code?: string };
type Feature = {
  properties?: {
    feature_type?: string;
    name?: string;
    context?: Partial<Record<"address" | "street" | "neighborhood" | "postcode" | "locality" | "place" | "district" | "region" | "country", Named>>;
  };
};

export function parseReverseGeocode(json: unknown): Place | null {
  const feature = (json as { features?: Feature[] })?.features?.[0];
  const props = feature?.properties;
  if (!props) return null;

  // The feature itself is not always repeated in its own context.
  const ctx = { ...props.context };
  const type = props.feature_type as keyof NonNullable<typeof ctx> | undefined;
  if (type && props.name && !ctx[type]) ctx[type] = { name: props.name };

  const city = ctx.place?.name ?? ctx.locality?.name ?? ctx.district?.name ?? null;
  const area = [ctx.neighborhood?.name, ctx.locality?.name, ctx.street?.name, ctx.address?.name].find(
    (n) => n && n !== city,
  );

  return {
    place_name: area ?? null,
    city,
    region: ctx.region?.name ?? null,
    country: ctx.country?.name ?? null,
    country_code: ctx.country?.country_code?.toUpperCase() ?? null,
  };
}

export function reverseGeocodeUrl(lat: number, lng: number, token: string) {
  const params = new URLSearchParams({
    longitude: lng.toFixed(6),
    latitude: lat.toFixed(6),
    // Results are stored, which Mapbox only allows with permanent geocoding.
    permanent: "true",
    language: "en",
    access_token: token,
  });
  return `https://api.mapbox.com/search/geocode/v6/reverse?${params}`;
}
