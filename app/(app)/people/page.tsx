import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PeopleList } from "@/components/people-list";
import { ScreenHeader } from "@/components/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { listLaterMeetings, listPeople } from "@/lib/data/people";
import { listOpenTasks } from "@/lib/data/tasks";
import { cn } from "@/lib/utils";

// ?state=empty previews the screen before anyone is saved.
export default async function PeoplePage({ searchParams }: PageProps<"/people">) {
  const { state } = await searchParams;
  const [people, laterMeetings, tasks] =
    state === "empty" ? [[], [], []] : await Promise.all([listPeople(), listLaterMeetings(), listOpenTasks()]);
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
      <PeopleList people={people} laterMeetings={laterMeetings} tasks={tasks} />
    </main>
  );
}
