"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon, ImagesIcon, QrCodeIcon, ScanTextIcon, XIcon } from "lucide-react";
import { useCardResult, type CardResult } from "@/components/capture/card-store";
import { usePhotos } from "@/components/photos/photo-store";
import { Button } from "@/components/ui/button";
import { detectQr } from "@/lib/cards/detect-qr";
import { parseQr, type CardDetails } from "@/lib/cards/parse-qr";
import { monthName } from "@/lib/format";
import { mockReadCard } from "@/lib/mock/card-read";
import { locateOnce, type LocateResult } from "@/lib/geo/locate";
import { mockDraft } from "@/lib/mock/people";
import { mockPlaceLabel } from "@/lib/mock/photos";
import { chooseGeotag } from "@/lib/photos/geotag";
import { preparePhoto } from "@/lib/photos/prepare";
import { cn } from "@/lib/utils";

type Phase = "starting" | "live" | "reading" | "result";

const noSubscribe = () => () => {};

// Live camera needs a secure page (HTTPS or localhost) and getUserMedia.
function useCameraSupported() {
  return useSyncExternalStore(
    noSubscribe,
    () => Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext,
    () => null,
  );
}

export function CardScanner() {
  const router = useRouter();
  const { add } = usePhotos();
  const { setResult } = useCardResult();
  const supported = useCameraSupported();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Where the card was scanned, started with the scan so it's ready by "Add to note".
  const locating = useRef<Promise<LocateResult> | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [still, setStill] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const [result, setLocalResult] = useState<CardResult | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  // Set while photographing a card whose QR held only a link; the link is
  // kept and the photo supplies the details.
  const [linkDetails, setLinkDetails] = useState<CardDetails | null>(null);

  const showResult = useCallback(
    (details: CardDetails, source: CardResult["source"]) => {
      navigator.vibrate?.(30);
      const merged = linkDetails
        ? {
            ...details,
            digitalCard: details.digitalCard ?? linkDetails.digitalCard,
            linkedin: details.linkedin ?? linkDetails.linkedin,
            line: details.line ?? linkDetails.line,
            websites: [...new Set([...details.websites, ...linkDetails.websites])],
          }
        : details;
      setLinkDetails(null);
      setLocalResult({ details: merged, source });
      setPhase("result");
    },
    [linkDetails],
  );

  // Start the rear camera.
  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        await video.play();
        setPhase("live");
      })
      .catch(() => setCameraDenied(true));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [supported]);

  // Look for a QR code a few times a second while the camera is live.
  useEffect(() => {
    // While photographing a link-only card, the QR would just be found again.
    if (phase !== "live" || linkDetails) return;
    let busy = false;
    const id = window.setInterval(async () => {
      const video = videoRef.current;
      if (busy || !video || video.readyState < 2) return;
      busy = true;
      try {
        const text = await detectQr(video);
        if (text) {
          grabFrame(video).then(setStill);
          showResult(parseQr(text).details, "qr");
        }
      } finally {
        busy = false;
      }
    }, 300);
    return () => window.clearInterval(id);
  }, [phase, showResult, linkDetails]);

  async function readStill(image: { url: string; blob: Blob; width: number; height: number }) {
    locating.current = locateOnce();
    setStill(image);
    setPhase("reading");
    if (!linkDetails) {
      const bitmap = await createImageBitmap(image.blob);
      const text = await detectQr(bitmap).catch(() => null);
      bitmap.close();
      if (text) return showResult(parseQr(text).details, "qr");
    }
    showResult(await mockReadCard(), "photo");
  }

  async function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    await readStill(await grabFrame(video));
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    try {
      const prepared = await preparePhoto(file);
      await readStill({ url: URL.createObjectURL(prepared.blob), ...prepared });
    } catch {
      toast.error("Couldn't open that photo");
    }
  }

  async function addToNote() {
    if (!result) return;
    if (still) {
      const located = await (locating.current ?? locateOnce());
      const geotag = chooseGeotag({
        exif: { lat: null, lng: null, takenAt: null },
        device: located.ok ? located.fix : null,
        fromCamera: true,
        lastModified: Date.now(),
        now: Date.now(),
      });
      add([
        {
          id: crypto.randomUUID(),
          person_id: null,
          capture_id: mockDraft.captureId,
          kind: "card",
          url: still.url,
          width: still.width,
          height: still.height,
          taken_at: geotag.takenAt,
          taken_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          lat: geotag.lat,
          lng: geotag.lng,
          location_accuracy_m: geotag.accuracyM,
          location_source: geotag.source,
          place_label: geotag.lat !== null ? mockPlaceLabel(geotag.lat, geotag.lng!) : null,
        },
      ]);
    }
    setResult(result);
    router.push("/capture/review");
  }

  const fallback = supported === false || cameraDenied;

  function scanAgain() {
    setLinkDetails(null);
    setLocalResult(null);
    setStill(null);
    setPhase(fallback ? "starting" : "live");
  }

  // The QR held only a link: keep it and take a photo of the card for the details.
  function photographCard() {
    setLinkDetails(result?.details ?? null);
    setLocalResult(null);
    setStill(null);
    setPhase(fallback ? "starting" : "live");
    if (fallback) {
      fileRef.current?.setAttribute("capture", "environment");
      fileRef.current?.click();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <header className="flex h-14 shrink-0 items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <Link href="/capture" aria-label="Close" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <XIcon className="size-5" />
        </Link>
        <h1 className="text-[0.95rem] font-medium">Scan a card</h1>
        <span className="size-11" />
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!fallback && (
          <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
        )}
        {still && (
          // eslint-disable-next-line @next/next/no-img-element -- object URL
          <img src={still.url} alt="" className="absolute inset-0 size-full object-contain" />
        )}

        {(phase === "live" || phase === "starting") && !fallback && (
          <>
            <div
              className="absolute top-1/2 left-1/2 aspect-[1.75] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/85 shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]"
              aria-hidden
            />
            <p className="absolute inset-x-6 bottom-6 text-center text-sm text-white/85">
              {phase === "starting"
                ? "Starting the camera…"
                : linkDetails
                  ? "Fit the card in the frame and take a photo."
                  : "Fit the card in the frame. QR codes are read automatically."}
            </p>
          </>
        )}

        {fallback && !still && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <ScanTextIcon className="size-10 text-white/70" aria-hidden />
            <p className="text-lg font-medium">Take a photo of the card</p>
            <p className="max-w-[32ch] text-sm text-white/70">
              {cameraDenied
                ? "Camera access is off. You can still take or choose a photo."
                : "The live camera isn't available here, so take a photo instead. QR codes on the card are read too."}
            </p>
          </div>
        )}

        {phase === "reading" && (
          <div className="absolute inset-x-6 bottom-6 flex items-center justify-center gap-2 rounded-xl bg-black/60 px-4 py-3 text-sm backdrop-blur-md" aria-live="polite">
            <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden />
            Reading the card&hellip;
          </div>
        )}
      </div>

      {phase !== "result" && (
        <div className="grid shrink-0 grid-cols-3 items-center px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              fileRef.current?.removeAttribute("capture");
              fileRef.current?.click();
            }}
            disabled={phase === "reading"}
            className="flex flex-col items-center gap-1 justify-self-start text-xs text-white/80 disabled:opacity-40"
          >
            <span className="grid size-12 place-items-center rounded-full bg-white/10">
              <ImagesIcon className="size-5" aria-hidden />
            </span>
            Library
          </button>
          <button
            type="button"
            aria-label="Take photo of card"
            disabled={phase === "reading" || phase === "starting"}
            onClick={() => {
              if (fallback) {
                fileRef.current?.setAttribute("capture", "environment");
                fileRef.current?.click();
              } else void takePhoto();
            }}
            className="grid size-18 place-items-center justify-self-center rounded-full border-4 border-white/40 bg-white text-black transition-transform duration-150 active:scale-95 disabled:opacity-40"
          >
            <CameraIcon className={cn("size-7", !fallback && "opacity-0")} aria-hidden />
          </button>
          <span />
        </div>
      )}

      {phase === "result" && result && (
        <ResultSheet result={result} onUse={addToNote} onAgain={scanAgain} onPhotograph={photographCard} />
      )}
    </div>
  );
}

function grabFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 2048 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise<{ url: string; blob: Blob; width: number; height: number }>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve({ url: URL.createObjectURL(blob), blob, width: canvas.width, height: canvas.height })
          : reject(new Error("Could not capture frame")),
      "image/jpeg",
      0.85,
    ),
  );
}

function ResultSheet({
  result,
  onUse,
  onAgain,
  onPhotograph,
}: {
  result: CardResult;
  onUse: () => void;
  onAgain: () => void;
  onPhotograph: () => void;
}) {
  const d = result.details;
  // Most digital-card QR codes hold only a profile link, not the details.
  const linkOnly =
    result.source === "qr" && !d.full_name && Boolean(d.digitalCard || d.linkedin || d.line || d.websites.length);
  const rows = [
    { label: "Digital card", value: d.digitalCard ? `${d.digitalCard.service}\n${d.digitalCard.url}` : null },
    { label: "Name", value: d.full_name },
    { label: "Company", value: d.company },
    { label: "Role", value: d.role },
    { label: d.phones.length > 1 ? "Phones" : "Phone", value: d.phones.join("\n") },
    { label: d.emails.length > 1 ? "Emails" : "Email", value: d.emails.join("\n") },
    { label: "Website", value: d.websites.join("\n") },
    { label: "LinkedIn", value: d.linkedin },
    { label: "LINE", value: d.line },
    { label: "Address", value: d.address },
    {
      label: "Birthday",
      value: d.birthday ? [d.birthday.day, monthName(d.birthday.month), d.birthday.year].filter(Boolean).join(" ") : null,
    },
    { label: "Note", value: d.notes },
  ].filter((r) => r.value);

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[75%] overflow-y-auto rounded-t-3xl bg-background px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground shadow-2xl">
      <span className="mx-auto mb-3 block h-1 w-9 rounded-full bg-border" aria-hidden />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {result.source === "qr" ? (
          <>
            <QrCodeIcon className="size-4 text-primary" aria-hidden /> Read from the QR code
          </>
        ) : (
          <>
            <ScanTextIcon className="size-4 text-primary" aria-hidden /> Read from the card &middot; sample result in
            this preview
          </>
        )}
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">Nothing readable on this card. Try again closer up.</p>
      ) : (
        <dl className="mt-3 divide-y border-y">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-sm text-muted-foreground">{r.label}</dt>
              <dd className="text-right text-[0.95rem] break-all whitespace-pre-line">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {linkOnly && (
        <div className="mt-4 rounded-2xl bg-muted p-4">
          <p className="text-[0.95rem] font-medium">
            This QR only links to their {d.digitalCard?.service ?? "online"} profile
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Take a photo of the paper card to add their name, number and company.
          </p>
          <Button variant="outline" size="touch" className="mt-3 w-full" onClick={onPhotograph}>
            <CameraIcon aria-hidden />
            Photograph the card
          </Button>
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" size="touch-lg" className="flex-1" onClick={onAgain}>
          Scan again
        </Button>
        <Button size="touch-lg" className="flex-[2]" onClick={onUse} disabled={rows.length === 0}>
          Add to note
        </Button>
      </div>
    </div>
  );
}
