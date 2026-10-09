import { notFound } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { getPerson, listPeople } from "@/lib/data/people";

export default async function EditPersonPage({ params }: PageProps<"/people/[id]/edit">) {
  const { id } = await params;
  const [person, people] = await Promise.all([getPerson(id), listPeople()]);
  if (!person) notFound();

  const { id: personId, ...initial } = person;

  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: `/people/${personId}`, label: "Back" }} showSettings={false} />
      <h1 className="type-heading mt-1 mb-6">Edit</h1>
      <PersonForm mode="edit" initial={initial} people={people} personId={personId} />
    </main>
  );
}
