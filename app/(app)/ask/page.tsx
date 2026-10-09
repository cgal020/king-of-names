import { AskScreen } from "@/components/ask/ask-screen";
import { listPeople } from "@/lib/data/people";

// ?state=empty previews Ask before anyone is saved.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const { state } = await searchParams;
  return <AskScreen people={state === "empty" ? [] : await listPeople()} />;
}
