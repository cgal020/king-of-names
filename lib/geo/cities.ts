// Cities offered by "Set city" when there's no GPS, with the point a pin goes
// to. Weighted to where Cameron's people are (the Gulf, Thailand, Australia)
// plus the usual business hubs; cities from the user's own people come first.
import type { Person } from "@/lib/types";

export type City = { city: string; country: string; lat: number; lng: number };

export const CITIES: City[] = [
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { city: "Sharjah", country: "United Arab Emirates", lat: 25.3463, lng: 55.4209 },
  { city: "Ras Al Khaimah", country: "United Arab Emirates", lat: 25.8007, lng: 55.9762 },
  { city: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { city: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
  { city: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531 },
  { city: "Manama", country: "Bahrain", lat: 26.2285, lng: 50.586 },
  { city: "Muscat", country: "Oman", lat: 23.588, lng: 58.3829 },
  { city: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
  { city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { city: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923 },
  { city: "Chiang Mai", country: "Thailand", lat: 18.7883, lng: 98.9853 },
  { city: "Pattaya", country: "Thailand", lat: 12.9236, lng: 100.8825 },
  { city: "Koh Samui", country: "Thailand", lat: 9.512, lng: 100.0136 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { city: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251 },
  { city: "Gold Coast", country: "Australia", lat: -28.0167, lng: 153.4 },
  { city: "Perth", country: "Australia", lat: -31.9505, lng: 115.8605 },
  { city: "Adelaide", country: "Australia", lat: -34.9285, lng: 138.6007 },
  { city: "Canberra", country: "Australia", lat: -35.2809, lng: 149.13 },
  { city: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869 },
  { city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { city: "Bali", country: "Indonesia", lat: -8.65, lng: 115.2167 },
  { city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297 },
  { city: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { city: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { city: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { city: "Istanbul", country: "Türkiye", lat: 41.0082, lng: 28.9784 },
  { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { city: "Monaco", country: "Monaco", lat: 43.7384, lng: 7.4246 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { city: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432 },
  { city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19 },
  { city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { city: "Miami", country: "United States", lat: 25.7617, lng: -80.1918 },
  { city: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
  { city: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
];

// The user's own cities first (most people first, centred on their pins),
// then the rest of the list alphabetically.
export function cityOptions(people: Pick<Person, "city" | "country" | "lat" | "lng">[]): City[] {
  const mine = new Map<string, { city: string; country: string | null; count: number; lat: number; lng: number; pins: number }>();
  for (const p of people) {
    if (!p.city) continue;
    const entry = mine.get(p.city) ?? { city: p.city, country: p.country, count: 0, lat: 0, lng: 0, pins: 0 };
    entry.count += 1;
    if (p.lat !== null && p.lng !== null) {
      entry.lat += p.lat;
      entry.lng += p.lng;
      entry.pins += 1;
    }
    mine.set(p.city, entry);
  }
  const own: City[] = [...mine.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .flatMap((e) => {
      const known = CITIES.find((c) => c.city === e.city);
      if (e.pins) return [{ city: e.city, country: e.country ?? known?.country ?? "", lat: e.lat / e.pins, lng: e.lng / e.pins }];
      return known ? [known] : [];
    });
  const rest = CITIES.filter((c) => !mine.has(c.city)).sort((a, b) => a.city.localeCompare(b.city));
  return [...own, ...rest];
}
