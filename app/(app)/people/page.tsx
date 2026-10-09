import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PeopleList } from "@/components/people-list";
import { ScreenHeader } from "@/components/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { listPeople } from "@/lib/data/people";
import { cn } from "@/lib/utils";

// ?state=empty previews the screen before anyone is saved.
export default async function PeoplePage({ searchParams }: PageProps<"/people">) {
  const { state } = await searchParams;
  const people = state === "empty" ? [] : await listPeople();
  return (
    <main className="mx-auto max-w-xl px-5 pb-8">
      <ScreenHeader
        title="People"
        actions={
          <Link
            href="/people/new"
            aria-label="Add someone"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "text-primary")}
          >
            <PlusIcon />
          </Link>
        }
      />
      <PeopleList people={people} />
    </main>
  );
}
