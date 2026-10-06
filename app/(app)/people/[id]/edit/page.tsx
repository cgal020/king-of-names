import { notFound } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { getMockPerson } from "@/lib/mock/people";

export default async function EditPersonPage({ params }: PageProps<"/people/[id]/edit">) {
  const { id } = await params;
  const person = getMockPerson(id);
  if (!person) notFound();

  const { id: personId, ...initial } = person;

  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: `/people/${personId}`, label: "Back" }} showSettings={false} />
      <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">Edit</h1>
      <PersonForm mode="edit" initial={initial} personId={personId} />
    </main>
  );
}
