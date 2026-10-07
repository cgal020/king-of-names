import Link from "next/link";
import { notFound } from "next/navigation";
import { BellIcon, PhoneIcon } from "lucide-react";
import { DeletePersonButton } from "@/components/delete-person-button";
import { MiniMap } from "@/components/map/mini-map";
import { OriginalNote } from "@/components/original-note";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { PersonPhotos } from "@/components/photos/person-photos";
import { ScreenHeader } from "@/components/screen-header";
import { TagList } from "@/components/tags/tag-editor";
import { buttonVariants } from "@/components/ui/button";
import { formatBirthday, formatMetDate, formatShortDate } from "@/lib/format";
import { getMockPerson, mockNotes } from "@/lib/mock/people";
import { cn } from "@/lib/utils";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const p = getMockPerson(id);
  if (!p) notFound();

  const note = mockNotes[p.id];
  const birthday = formatBirthday(p.birthday_day, p.birthday_month, p.birthday_year);
  const work = [p.extras.role, p.extras.company].filter(Boolean).join(", ");
  const place = [p.place_name, p.city].filter(Boolean).join(", ");

  const details = [
    { label: "Birthday", value: birthday },
    { label: "Email", value: p.extras.email, href: p.extras.email ? `mailto:${p.extras.email}` : undefined },
    { label: "In your words", value: p.where_met_text },
  ].filter((d) => d.value);

  return (
    <main className="mx-auto max-w-xl px-5 pb-10">
      <ScreenHeader
        back={{ href: "/people", label: "People" }}
        showSettings={false}
        actions={
          <Link
            href={`/people/${p.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "touch" }), "-mr-3 text-primary")}
          >
            Edit
          </Link>
        }
      />

      <header className="mt-3">
        <PersonAvatar personId={p.id} name={p.full_name} size={72} className="mb-4 text-xl" />
        <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-tight">{p.full_name}</h1>
        {work && <p className="mt-2 text-lg">{work}</p>}
        <p className="mt-1 text-[0.95rem] text-muted-foreground">
          Met {formatMetDate(p.met_at, p.met_timezone)}
          {place && <> &middot; {place}</>}
        </p>
        <TagList relationship={p.relationship} tags={p.tags} className="mt-3" />
      </header>

      {p.phone && (
        <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className={cn(buttonVariants({ variant: "outline", size: "touch-lg" }), "mt-6 w-full justify-start")}>
          <PhoneIcon aria-hidden className="text-primary" />
          <span className="tabular-nums">{p.phone}</span>
        </a>
      )}

      {(p.follow_up_note || p.follow_up_date) && (
        <div className="mt-4 flex gap-3 rounded-2xl bg-primary/8 p-4">
          <BellIcon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-primary">
              Follow up{p.follow_up_date && <> &middot; {formatShortDate(p.follow_up_date)}</>}
            </p>
            {p.follow_up_note && <p className="mt-0.5 text-[0.95rem]">{p.follow_up_note}</p>}
          </div>
        </div>
      )}

      {p.notes && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Notes</h2>
          <p className="max-w-[65ch] text-[1.0625rem] leading-relaxed text-pretty">{p.notes}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Photos</h2>
        <PersonPhotos personId={p.id} />
      </section>

      {details.length > 0 && (
        <dl className="mt-8 divide-y border-y">
          {details.map((d) => (
            <div key={d.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="shrink-0 text-sm text-muted-foreground">{d.label}</dt>
              <dd className="text-right text-[0.95rem]">
                {d.href ? (
                  <a href={d.href} className="text-primary">
                    {d.value}
                  </a>
                ) : (
                  d.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Where you met</h2>
        <MiniMap lat={p.lat} lng={p.lng} />
        <p className="mt-2 text-sm text-muted-foreground">
          {p.lat !== null ? (
            <>
              {[place, p.country].filter(Boolean).join(" · ")}
              {p.location_accuracy_m && <> &middot; GPS within {Math.round(p.location_accuracy_m)} m</>}
            </>
          ) : (
            <>{[p.city, p.country].filter(Boolean).join(", ")} &middot; city set by hand</>
          )}
        </p>
      </section>

      {note && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Your original note</h2>
          <OriginalNote transcript={note.transcript} durationSeconds={note.durationSeconds} />
        </section>
      )}

      <div className="mt-10">
        <DeletePersonButton name={p.full_name} />
      </div>
    </main>
  );
}
