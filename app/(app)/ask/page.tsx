import { AskScreen } from "@/components/ask/ask-screen";
import { mockPeople } from "@/lib/mock/people";

export default function AskPage() {
  return <AskScreen people={mockPeople} />;
}
