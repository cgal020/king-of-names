import { AskScreen } from "@/components/ask/ask-screen";
import { mockPeople } from "@/lib/mock/people";

// ?state=empty previews Ask before anyone is saved.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const { state } = await searchParams;
  return <AskScreen people={state === "empty" ? [] : mockPeople} />;
}
