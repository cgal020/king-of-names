const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number) {
  return MONTHS[month - 1];
}

// "4 Oct 2026", shown in the timezone the person was met in when known.
export function formatMetDate(iso: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timeZone ?? undefined,
  }).format(new Date(iso));
}

export function formatMetDateTime(iso: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone ?? undefined,
  }).format(new Date(iso));
}

// "October 2026", used to group the people list.
export function formatMonthGroup(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(iso));
}

export function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

// "14 November", or "2 July 1979" when the year is known.
export function formatBirthday(day: number | null, month: number | null, year: number | null) {
  if (!month) return null;
  const parts = [day, monthName(month), year].filter(Boolean);
  return parts.join(" ");
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

// Great-circle distance in kilometres.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function firstLine(text: string | null) {
  if (!text) return "";
  return text.split(/(?<=[.!?])\s|\n/)[0];
}

export function placeLine(p: { place_name: string | null; city: string | null; country: string | null }) {
  return [p.place_name, p.city].filter(Boolean).join(", ") || p.country || "Place not set";
}

// Minutes a time zone is ahead of UTC at a given instant (Dubai: 240).
function zoneOffsetMinutes(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - utcMs) / 60_000);
}

// "2026-10-06T21:42" read as a wall-clock time in a time zone (the one where
// they met), back to an exact ISO instant. Without a zone, the phone's own.
export function localInputToIso(local: string, timeZone: string | null) {
  const [date, time = "00:00"] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  if (!timeZone) return new Date(y, m - 1, d, h, min).toISOString();
  const wall = Date.UTC(y, m - 1, d, h, min);
  // Twice, so a time near a daylight-saving change settles on the right offset.
  let utc = wall - zoneOffsetMinutes(wall, timeZone) * 60_000;
  utc = wall - zoneOffsetMinutes(utc, timeZone) * 60_000;
  return new Date(utc).toISOString();
}
