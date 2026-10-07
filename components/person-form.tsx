"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleAlertIcon, PlusIcon, ScanTextIcon, UsersIcon } from "lucide-react";
import { useCardResult } from "@/components/capture/card-store";
import { ConfirmButton } from "@/components/confirm-button";
import { MiniMap } from "@/components/map/mini-map";
import { OriginalNote } from "@/components/original-note";
import { PhotoStrip } from "@/components/photos/photo-strip";
import { usePhotos, usePhotosFor } from "@/components/photos/photo-store";
import { TagEditor } from "@/components/tags/tag-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mergeCard, type CardField } from "@/lib/cards/merge";
import { formatMetDate, monthName } from "@/lib/format";
import { mockCities, mockPeople } from "@/lib/mock/people";
import { findSimilar } from "@/lib/similar";
import { knownTags } from "@/lib/tags";
import type { Confidence, Person } from "@/lib/types";
import { cn } from "@/lib/utils";

type PersonInput = Omit<Person, "id" | "created_at" | "updated_at">;

type PersonFormProps = {
  mode: "review" | "new" | "edit";
  initial: PersonInput;
  personId?: string;
  // The capture this draft came from; photos taken for it hang off this id.
  captureId?: string;
  transcript?: string | null;
  durationSeconds?: number | null;
  nameConfidence?: Confidence;
};

type Section = "phone" | "birthday" | "followUp" | "work" | "email" | "web" | "address";

const SECTION_LABELS: Record<Section, string> = {
  phone: "Phone",
  birthday: "Birthday",
  followUp: "Follow-up",
  work: "Company & role",
  email: "Email",
  web: "Website",
  address: "Address",
};

// "2026-10-06T21:42" in the timezone the person was met in.
function toLocalInput(iso: string, timeZone: string | null) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function cityCenter(city: string) {
  const inCity = mockPeople.filter((p) => p.city === city && p.lat !== null && p.lng !== null);
  if (!inCity.length) return null;
  return {
    lat: inCity.reduce((sum, p) => sum + p.lat!, 0) / inCity.length,
    lng: inCity.reduce((sum, p) => sum + p.lng!, 0) / inCity.length,
  };
}

export function PersonForm({
  mode,
  initial,
  personId,
  captureId,
  transcript,
  durationSeconds,
  nameConfidence = "high",
}: PersonFormProps) {
  const router = useRouter();
  const draftId = useId();
  const photoTarget =
    mode === "edit" ? { personId } : { captureId: captureId ?? `new${draftId}` };
  const photos = usePhotosFor(photoTarget);
  const { attachDraft } = usePhotos();
  const { result: card, setResult: setCard } = useCardResult();
  // Details from a scanned business card are merged into the draft once.
  const [merged] = useState(() =>
    mode === "review" && card ? mergeCard(initial, card.details, nameConfidence) : null,
  );
  const fromCard = (field: CardField) => Boolean(merged?.fromCard.has(field));
  const [values, setValues] = useState(() => {
    const start = merged?.person ?? initial;
    return { ...start, met_at_local: toLocalInput(start.met_at, start.met_timezone) };
  });
  const [opened, setOpened] = useState<Set<Section>>(new Set());
  const [nameTouched, setNameTouched] = useState(false);
  const [tagsTouched, setTagsTouched] = useState(false);
  const tagSuggestions = useMemo(() => knownTags(mockPeople), []);
  const [duplicateChoice, setDuplicateChoice] = useState<"new" | string>("new");
  const [changingCity, setChangingCity] = useState(false);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setExtra = (key: string, value: string) =>
    setValues((v) => ({ ...v, extras: { ...v.extras, [key]: value } }));

  const has: Record<Section, boolean> = {
    phone: Boolean(values.phone),
    birthday: Boolean(values.birthday_month),
    followUp: Boolean(values.follow_up_note || values.follow_up_date),
    work: Boolean(values.extras.company || values.extras.role),
    email: Boolean(values.extras.email),
    web: Boolean(values.extras.website || values.extras.linkedin),
    address: Boolean(values.extras.address),
  };
  const visible = (s: Section) => has[s] || opened.has(s);
  const hidden = (Object.keys(SECTION_LABELS) as Section[]).filter((s) => !visible(s));

  const duplicates = useMemo(
    () =>
      mode === "edit"
        ? []
        : findSimilar(values.full_name, mockPeople).filter((p) => p.id !== personId),
    [mode, values.full_name, personId],
  );
  const updating = duplicates.find((p) => p.id === duplicateChoice);
  // A name printed on a scanned card settles any doubt about the spoken one.
  const cardHasName = Boolean(merged && card?.details.full_name);
  const flagName = mode === "review" && nameConfidence !== "high" && !nameTouched && !cardHasName;
  const canSave = values.full_name.trim().length > 0;

  function save() {
    if (!canSave) return;
    const name = values.full_name.trim();
    if (photoTarget.captureId) attachDraft(photoTarget.captureId, updating?.id ?? personId ?? null);
    setCard(null);
    toast.success(updating ? `Updated ${updating.full_name}` : `Saved ${name}`, {
      description: "Preview only. Nothing was stored.",
    });
    router.push(updating ? `/people/${updating.id}` : personId ? `/people/${personId}` : "/people");
  }

  function discard() {
    if (photoTarget.captureId) attachDraft(photoTarget.captureId, null);
    setCard(null);
    toast("Note discarded", { description: "The recording would be deleted." });
    router.push("/capture");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="pb-28"
    >
      <div className="space-y-7">
        {/* Name */}
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            Name
            {fromCard("full_name") && <FromCard />}
          </label>
          <Input
            id="full_name"
            value={values.full_name}
            onChange={(e) => {
              setNameTouched(true);
              set("full_name", e.target.value);
            }}
            autoComplete="off"
            autoCapitalize="words"
            placeholder="Their name"
            aria-describedby={flagName ? "name-hint" : undefined}
            className={cn(
              "h-14 rounded-xl px-3.5 text-[1.625rem] font-semibold tracking-tight md:text-[1.625rem]",
              flagName && "border-amber-500 ring-3 ring-amber-500/20 dark:border-amber-400",
            )}
          />
          {flagName && (
            <p id="name-hint" className="mt-2 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
              <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
              Check the spelling. The name was hard to make out.
            </p>
          )}
        </div>

        {duplicates.length > 0 && (
          <DuplicatePrompt
            people={duplicates}
            choice={duplicateChoice}
            onChoose={setDuplicateChoice}
          />
        )}

        {/* When and where */}
        <div className="space-y-4">
          <Field label="Where you met" htmlFor="where_met_text">
            <Input
              id="where_met_text"
              value={values.where_met_text ?? ""}
              onChange={(e) => set("where_met_text", e.target.value)}
              placeholder="In your words, e.g. Omar's dinner at Zuma"
              className="h-11 rounded-xl px-3.5"
            />
          </Field>

          <div>
            <MiniMap lat={values.lat} lng={values.lng} />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 text-[0.95rem]">
                <span className="font-medium">
                  {[values.place_name, values.city].filter(Boolean).join(", ") || "No city yet"}
                </span>
                {values.country && <span className="text-muted-foreground"> &middot; {values.country}</span>}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="touch"
                className="-mr-3 shrink-0 text-primary"
                onClick={() => setChangingCity((c) => !c)}
                aria-expanded={changingCity}
              >
                {values.city ? "Change" : "Set city"}
              </Button>
            </div>
            {changingCity && (
              <select
                aria-label="City"
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
                value={values.city ?? ""}
                onChange={(e) => {
                  const entry = mockCities.find((c) => c.city === e.target.value);
                  const center = entry ? cityCenter(entry.city) : null;
                  setValues((v) => ({
                    ...v,
                    city: entry?.city ?? null,
                    country: entry?.country ?? null,
                    place_name: null,
                    lat: center?.lat ?? null,
                    lng: center?.lng ?? null,
                  }));
                  setChangingCity(false);
                }}
              >
                <option value="" disabled>
                  Choose a city
                </option>
                {mockCities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}, {c.country}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Field label="When" htmlFor="met_at">
            <Input
              id="met_at"
              type="datetime-local"
              value={values.met_at_local}
              onChange={(e) => set("met_at_local", e.target.value)}
              className="h-11 rounded-xl px-3.5"
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={values.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="What they do, who introduced you, anything worth remembering"
            rows={3}
            className="min-h-24 rounded-xl px-3.5 py-2.5 text-base leading-relaxed"
          />
        </Field>

        <TagEditor
          relationship={values.relationship}
          tags={values.tags}
          suggestions={tagSuggestions}
          aiSuggested={mode === "review" && !tagsTouched}
          onChange={({ relationship, tags }) => {
            setTagsTouched(true);
            setValues((v) => ({ ...v, relationship, tags }));
          }}
        />

        <div>
          <h2 className="mb-1.5 text-sm font-medium text-muted-foreground">Photos</h2>
          <PhotoStrip photos={photos} target={photoTarget} />
        </div>

        {visible("followUp") && (
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-muted-foreground">Follow-up</legend>
            <Input
              aria-label="Follow-up note"
              value={values.follow_up_note ?? ""}
              onChange={(e) => set("follow_up_note", e.target.value)}
              placeholder="Remind me to…"
              className="h-11 rounded-xl px-3.5"
            />
            <Input
              aria-label="Follow-up date"
              type="date"
              value={values.follow_up_date ?? ""}
              onChange={(e) => set("follow_up_date", e.target.value || null)}
              className="h-11 rounded-xl px-3.5"
            />
          </fieldset>
        )}

        {visible("phone") && (
          <Field label="Phone" htmlFor="phone" fromCard={fromCard("phone")}>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={values.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              className="h-11 rounded-xl px-3.5"
            />
          </Field>
        )}

        {visible("birthday") && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-muted-foreground">
              Birthday
              {fromCard("birthday") && <FromCard />}
            </legend>
            <div className="grid grid-cols-[1fr_2fr_1.3fr] gap-2">
              <select
                aria-label="Birthday day"
                value={values.birthday_day ?? ""}
                onChange={(e) => set("birthday_day", e.target.value ? Number(e.target.value) : null)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                aria-label="Birthday month"
                value={values.birthday_month ?? ""}
                onChange={(e) => set("birthday_month", e.target.value ? Number(e.target.value) : null)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthName(i + 1)}
                  </option>
                ))}
              </select>
              <Input
                aria-label="Birthday year (optional)"
                inputMode="numeric"
                placeholder="Year"
                value={values.birthday_year ?? ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  set("birthday_year", digits ? Number(digits) : null);
                }}
                className="h-11 rounded-xl px-3"
              />
            </div>
          </fieldset>
        )}

        {visible("work") && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Company" htmlFor="company" fromCard={fromCard("company")}>
              <Input
                id="company"
                value={values.extras.company ?? ""}
                onChange={(e) => setExtra("company", e.target.value)}
                className="h-11 rounded-xl px-3.5"
              />
            </Field>
            <Field label="Role" htmlFor="role" fromCard={fromCard("role")}>
              <Input
                id="role"
                value={values.extras.role ?? ""}
                onChange={(e) => setExtra("role", e.target.value)}
                className="h-11 rounded-xl px-3.5"
              />
            </Field>
          </div>
        )}

        {visible("email") && (
          <Field label="Email" htmlFor="email" fromCard={fromCard("email")}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={values.extras.email ?? ""}
              onChange={(e) => setExtra("email", e.target.value)}
              className="h-11 rounded-xl px-3.5"
            />
          </Field>
        )}

        {visible("web") && (
          <div className="space-y-4">
            {(values.extras.website || opened.has("web") || !values.extras.linkedin) && (
              <Field label="Website" htmlFor="website" fromCard={fromCard("website")}>
                <Input
                  id="website"
                  type="url"
                  inputMode="url"
                  value={values.extras.website ?? ""}
                  onChange={(e) => setExtra("website", e.target.value)}
                  className="h-11 rounded-xl px-3.5"
                />
              </Field>
            )}
            {(values.extras.linkedin || fromCard("linkedin")) && (
              <Field label="LinkedIn" htmlFor="linkedin" fromCard={fromCard("linkedin")}>
                <Input
                  id="linkedin"
                  type="url"
                  inputMode="url"
                  value={values.extras.linkedin ?? ""}
                  onChange={(e) => setExtra("linkedin", e.target.value)}
                  className="h-11 rounded-xl px-3.5"
                />
              </Field>
            )}
          </div>
        )}

        {visible("address") && (
          <Field label="Address" htmlFor="address" fromCard={fromCard("address")}>
            <Input
              id="address"
              value={values.extras.address ?? ""}
              onChange={(e) => setExtra("address", e.target.value)}
              className="h-11 rounded-xl px-3.5"
            />
          </Field>
        )}

        {hidden.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hidden.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setOpened((o) => new Set(o).add(s))}
                className="flex h-9 items-center gap-1 rounded-full border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PlusIcon className="size-3.5" aria-hidden />
                {SECTION_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {mode === "review" && (transcript || durationSeconds) && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Your note</h2>
            <OriginalNote transcript={transcript ?? null} durationSeconds={durationSeconds ?? null} />
          </div>
        )}
      </div>

      {/* Actions stay in thumb reach, above the tab bar. */}
      <div className="fixed inset-x-0 bottom-(--tabbar-h) z-20 border-t bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl gap-3 px-5 py-3">
          {mode === "review" ? (
            <ConfirmButton
              label="Discard"
              title="Discard this note?"
              description="The recording and transcript will be deleted. This can't be undone."
              confirmLabel="Discard"
              cancelLabel="Keep"
              onConfirm={discard}
              className="flex-1"
            />
          ) : (
            <Link
              href={personId ? `/people/${personId}` : "/people"}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border text-base font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </Link>
          )}
          <Button type="submit" size="touch-lg" className="flex-[2]" disabled={!canSave}>
            {updating ? `Update ${updating.full_name.split(" ")[0]}` : mode === "edit" ? "Save changes" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FromCard() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
      <ScanTextIcon className="size-3" aria-hidden />
      From card
    </span>
  );
}

function Field({
  label,
  htmlFor,
  fromCard,
  children,
}: {
  label: string;
  htmlFor: string;
  fromCard?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label}
        {fromCard && <FromCard />}
      </label>
      {children}
    </div>
  );
}

function DuplicatePrompt({
  people,
  choice,
  onChoose,
}: {
  people: Person[];
  choice: string;
  onChoose: (choice: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="flex items-center gap-2 text-[0.95rem] font-medium">
        <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
        Already met?
      </p>
      <div role="radiogroup" aria-label="Save as" className="mt-3 space-y-2">
        {people.map((p) => (
          <ChoiceRow
            key={p.id}
            selected={choice === p.id}
            onSelect={() => onChoose(p.id)}
            title={`Update ${p.full_name}`}
            detail={`Met in ${p.city ?? "an unknown place"}, ${formatMetDate(p.met_at, p.met_timezone)}`}
          />
        ))}
        <ChoiceRow
          selected={choice === "new"}
          onSelect={() => onChoose("new")}
          title="Save as a new person"
          detail="Keep them separate"
        />
      </div>
    </div>
  );
}

function ChoiceRow({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-left transition-colors duration-150",
        selected ? "border-primary" : "border-transparent",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
        aria-hidden
      >
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}
