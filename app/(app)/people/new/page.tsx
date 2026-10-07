import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { mockCurrentLocation } from "@/lib/mock/people";

export default function NewPersonPage() {
  // Manual entries are stamped with the current time and place too.
  const initial = {
    full_name: "",
    met_at: new Date().toISOString(),
    met_timezone: "Asia/Dubai",
    lat: mockCurrentLocation.lat,
    lng: mockCurrentLocation.lng,
    location_accuracy_m: mockCurrentLocation.accuracy,
    place_name: mockCurrentLocation.placeName,
    city: mockCurrentLocation.city,
    region: "Dubai",
    country: "United Arab Emirates",
    where_met_text: null,
    phone: null,
    birthday_month: null,
    birthday_day: null,
    birthday_year: null,
    notes: null,
    follow_up_note: null,
    follow_up_date: null,
    extras: {},
    relationship: null,
    tags: [],
  };

  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/people", label: "People" }} showSettings={false} />
      <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">Add someone</h1>
      <PersonForm mode="new" initial={initial} />
    </main>
  );
}
