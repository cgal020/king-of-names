import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { listPeople, usingSampleData } from "@/lib/data/people";
import { mockCurrentLocation } from "@/lib/mock/people";

export default async function NewPersonPage() {
  const people = await listPeople();
  // Manual entries are stamped with the current time and place too. The
  // preview uses a sample place; the real app asks the phone once the form opens.
  const here = usingSampleData()
    ? {
        lat: mockCurrentLocation.lat,
        lng: mockCurrentLocation.lng,
        location_accuracy_m: mockCurrentLocation.accuracy,
        place_name: mockCurrentLocation.placeName,
        city: mockCurrentLocation.city,
        region: "Dubai",
        country: "United Arab Emirates",
      }
    : { lat: null, lng: null, location_accuracy_m: null, place_name: null, city: null, region: null, country: null };
  const initial = {
    full_name: "",
    met_at: new Date().toISOString(),
    // The preview's sample place is in Dubai; otherwise the phone's own zone is used.
    met_timezone: usingSampleData() ? "Asia/Dubai" : null,
    ...here,
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
      <h1 className="type-heading mt-1 mb-6">Add someone</h1>
      <PersonForm mode="new" initial={initial} people={people} />
    </main>
  );
}
