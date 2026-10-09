import { MapScreen } from "@/components/map/map-screen";
import { listLaterMeetings, listPeople, usingSampleData } from "@/lib/data/people";

export default async function MapPage() {
  const [people, laterMeetings] = await Promise.all([listPeople(), listLaterMeetings()]);
  return <MapScreen people={people} laterMeetings={laterMeetings} sample={usingSampleData()} />;
}
