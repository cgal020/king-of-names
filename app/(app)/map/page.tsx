import { MapScreen } from "@/components/map/map-screen";
import { mockPeople } from "@/lib/mock/people";

export default function MapPage() {
  return <MapScreen people={mockPeople} />;
}
