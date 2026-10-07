"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ImageIcon,
  MapPinIcon,
  MapPinOffIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { usePhotoPicker } from "@/components/photos/photo-picker";
import { usePhotos } from "@/components/photos/photo-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Photo, PhotoKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const KIND_LABEL: Record<PhotoKind, string> = { person: "Them", card: "Card", moment: "Place" };
const KIND_ICON = { person: UserRoundIcon, card: CreditCardIcon, moment: ImageIcon } as const;

export function locationLine(photo: Photo) {
  if (photo.location_source === "none") return "No location saved in this photo";
  const source = photo.location_source === "device" ? "from phone GPS" : "from the photo";
  return `${photo.place_label ?? "Located"} · ${source}`;
}

// Shown in local time where the photo was taken, when that zone is known.
function formatTaken(iso: string | null, timeZone: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone ?? undefined,
  }).format(new Date(iso));
}

// A row of photo thumbnails with an "add" control. Tapping a photo opens the viewer.
export function PhotoStrip({
  photos,
  target,
  editable = true,
}: {
  photos: Photo[];
  target: { personId?: string | null; captureId?: string | null };
  editable?: boolean;
}) {
  const picker = usePhotoPicker();
  const [choosing, setChoosing] = useState(false);
  const [askingPermission, setAskingPermission] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  return (
    <div>
      {picker.input}
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {photos.map((photo, i) => {
          const Icon = KIND_ICON[photo.kind];
          return (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setViewing(i)}
                aria-label={`${KIND_LABEL[photo.kind]} photo. ${locationLine(photo)}`}
                className="relative block size-24 overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- object and signed URLs */}
                <img src={photo.url} alt="" className="size-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.7rem] font-medium text-white backdrop-blur-sm">
                  <Icon className="size-3" aria-hidden />
                  {KIND_LABEL[photo.kind]}
                </span>
                {photo.location_source !== "none" && (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-black/55 text-white">
                    <MapPinIcon className="size-3" aria-hidden />
                  </span>
                )}
              </button>
            </li>
          );
        })}

        {picker.busy && (
          <li className="shrink-0">
            <Skeleton className="size-24 rounded-xl" />
          </li>
        )}

        {editable &&
          (choosing ? (
            (["person", "card", "moment"] as const).map((kind) => {
              const Icon = KIND_ICON[kind];
              return (
                <li key={kind} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setChoosing(false);
                      // Photos of people need their permission first.
                      if (kind === "person") setAskingPermission(true);
                      else picker.open({ ...target, kind });
                    }}
                    className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <Icon className="size-5" aria-hidden />
                    {KIND_LABEL[kind]}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setChoosing(true)}
                className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PlusIcon className="size-5" aria-hidden />
                Add photo
              </button>
            </li>
          ))}
      </ul>

      {askingPermission && (
        <div role="alertdialog" aria-labelledby="photo-permission-title" className="mt-3 rounded-2xl bg-muted p-4">
          <p id="photo-permission-title" className="text-[0.95rem] font-medium">
            Do you have their permission?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only keep a photo of someone who has agreed to it. In the UAE, taking or keeping a person&rsquo;s photo
            without consent is a crime. A photo of their card or the place works without one.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="touch" className="flex-1" onClick={() => setAskingPermission(false)}>
              Cancel
            </Button>
            <Button
              size="touch"
              className="flex-[2]"
              onClick={() => {
                setAskingPermission(false);
                picker.open({ ...target, kind: "person" });
              }}
            >
              They agreed
            </Button>
          </div>
        </div>
      )}

      {viewing !== null && photos[viewing] && (
        <PhotoViewer
          photos={photos}
          index={viewing}
          editable={editable}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function PhotoViewer({
  photos,
  index,
  editable,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number;
  editable: boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { update, remove } = usePhotos();
  const photo = photos[index];

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const taken = formatTaken(photo.taken_at, photo.taken_timezone);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`${KIND_LABEL[photo.kind]} photo`}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black"
    >
      <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-14 items-center justify-between px-2">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="grid size-11 place-items-center rounded-full hover:bg-white/10"
          >
            <XIcon className="size-5" />
          </button>
          <span className="text-sm text-white/70 tabular-nums">
            {index + 1} of {photos.length}
          </span>
          {editable ? (
            <button
              type="button"
              onClick={() => {
                remove(photo.id);
                ref.current?.close();
              }}
              aria-label="Delete photo"
              className="grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10"
            >
              <Trash2Icon className="size-5" />
            </button>
          ) : (
            <span className="size-11" />
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- object and signed URLs */}
          <img src={photo.url} alt="" className="max-h-full max-w-full object-contain" />
          {index > 0 && (
            <button
              type="button"
              onClick={() => onIndex(index - 1)}
              aria-label="Previous photo"
              className="absolute left-2 grid size-11 place-items-center rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => onIndex(index + 1)}
              aria-label="Next photo"
              className="absolute right-2 grid size-11 place-items-center rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          )}
        </div>

        <div className="space-y-3 px-5 pt-4 pb-5">
          <p className="flex items-start gap-2 text-[0.95rem]">
            {photo.location_source === "none" ? (
              <MapPinOffIcon className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden />
            ) : (
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-white/80" aria-hidden />
            )}
            <span>
              <span className={cn(photo.location_source === "none" && "text-white/70")}>{locationLine(photo)}</span>
              {taken && <span className="block text-sm text-white/60">{taken}</span>}
            </span>
          </p>
          {editable && (
            <div role="radiogroup" aria-label="This photo shows" className="grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1">
              {(["person", "card", "moment"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={photo.kind === kind}
                  onClick={() => update(photo.id, { kind })}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium transition-colors duration-150",
                    photo.kind === kind ? "bg-white text-black" : "text-white/80 hover:text-white",
                  )}
                >
                  {KIND_LABEL[kind]}
                </button>
              ))}
            </div>
          )}
          {editable && photo.kind === "person" && (
            <p className="text-sm text-white/70">Keep a photo of someone only with their permission.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
