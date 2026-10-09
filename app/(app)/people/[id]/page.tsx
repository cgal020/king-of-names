import Link from "next/link";
import { notFound } from "next/navigation";
import { BellIcon, CalendarIcon, PhoneIcon } from "lucide-react";
import { DeletePersonButton } from "@/components/delete-person-button";
import { MiniMap } from "@/components/map/mini-map";
import { MeetingTimeline } from "@/components/meeting-timeline";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { PersonPhotos } from "@/components/photos/person-photos";
import { SaveContactButton } from "@/components/save-contact-button";
import { ScreenHeader } from "@/components/screen-header";
import { TagList } from "@/components/tags/tag-editor";
import { buttonVariants } from "@/components/ui/button";
import { formatBirthday, formatMetDate, formatShortDate } from "@/lib/format";
import { getPerson, listMeetings, usingSampleData } from "@/lib/data/people";
import { cn } from "@/lib/utils";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const p = await getPerson(id);
  if (!p) notFound();

  const meetings = await listMeetings(p);
  const latest = meetings[0];
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
        <div className="flex items-center gap-3.5">
          <PersonAvatar personId={p.id} name={p.full_name} size={56} />
          <TagList relationship={p.relationship} tags={p.tags} />
        </div>
        {/* The name is the largest text on the screen. */}
        <h1 className="type-name mt-3.5">
          <bdi dir="auto">{p.full_name}</bdi>
        </h1>
        {work && <p className="mt-1.5 text-[1.0625rem]">{work}</p>}
        <p className="mt-2 flex gap-1.5 text-[0.9375rem] text-muted-foreground">
          <CalendarIcon className="mt-[3px] size-4 shrink-0" aria-hidden />
          <span>
          {meetings.length > 1 ? (
            <>
              Last met {formatMetDate(latest.met_at, latest.met_timezone)}
              {latest.city && <> in {latest.city}</>} &middot; first met {formatMetDate(p.met_at, p.met_timezone)}
            </>
          ) : (
            <>
              Met {formatMetDate(p.met_at, p.met_timezone)}
              {place && <> &middot; {place}</>}
            </>
          )}
          </span>
        </p>
      </header>

      <div className={cn("mt-5 grid gap-2", p.phone ? "grid-cols-2" : "grid-cols-1")}>
        {p.phone && (
          <a
            href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
            aria-label={`Call ${p.phone}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-16 flex-col gap-1 rounded-xl bg-muted text-[0.8125rem] text-primary [&_svg:not([class*='size-'])]:size-4.5",
            )}
          >
            <PhoneIcon aria-hidden strokeWidth={1.9} />
            Call
          </a>
        )}
        <SaveContactButton person={p} />
      </div>

      {(p.follow_up_note || p.follow_up_date) && (
        <div className="mt-4 flex gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
          <BellIcon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              Follow up{p.follow_up_date && <> &middot; {formatShortDate(p.follow_up_date)}</>}
            </p>
            {p.follow_up_note && <p className="mt-0.5 text-[0.95rem]">{p.follow_up_note}</p>}
          </div>
        </div>
      )}

      {p.notes && (
        <section className="mt-8">
          <h2 className="type-section mb-2">Notes</h2>
          <p className="max-w-[65ch] text-[1.0625rem] leading-relaxed text-pretty">{p.notes}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="type-section mb-2">Photos</h2>
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
        <h2 className="type-section mb-2">Where you met</h2>
        <MiniMap lat={p.lat} lng={p.lng} />
        <p className="mt-2 text-sm text-muted-foreground">
          {p.lat !== null ? (
            <>
              {[place, p.country].filter(Boolean).join(" · ")}
              {p.location_accuracy_m ? <> &middot; GPS within {Math.round(p.location_accuracy_m)} m</> : <> &middot; pin placed by hand</>}
            </>
          ) : (
            <>{[p.city, p.country].filter(Boolean).join(", ")} &middot; city set by hand</>
          )}
        </p>
      </section>

      <MeetingTimeline personId={p.id} initial={meetings} canAdd={usingSampleData()} />

      <div className="mt-10">
        <DeletePersonButton personId={p.id} name={p.full_name} />
      </div>
    </main>
  );
}
