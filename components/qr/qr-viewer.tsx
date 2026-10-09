"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { PencilIcon, QrCodeIcon, SunIcon, XIcon } from "lucide-react";
import { DesignedQr, PurposeMark } from "@/components/qr/designed-qr";
import { buttonVariants } from "@/components/ui/button";
import { PURPOSE_META, qrUrl, type QrCode } from "@/lib/qr/codes";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
// The address codes open: the live site, or wherever this app is running.
const siteOrigin = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

// Full screen, one code at a time; swipe sideways for the next. Opened from
// Capture, so it's one tap away when someone asks for your details.
export function QrViewer({ codes }: { codes: QrCode[] }) {
  const origin = useSyncExternalStore(noSubscribe, siteOrigin, () => null);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function go(i: number) {
    track.current?.children[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <main className="fixed inset-0 z-40 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between px-3 pt-2">
        <Link href="/capture" aria-label="Close" className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }))}>
          <XIcon />
        </Link>
        {codes.length > 0 && (
          <Link href="/settings#qr" className={cn(buttonVariants({ variant: "ghost", size: "touch" }), "text-primary")}>
            <PencilIcon aria-hidden />
            Edit codes
          </Link>
        )}
      </header>

      {codes.length === 0 ? (
        <section className="mx-auto flex max-w-sm flex-1 flex-col items-start justify-center px-6">
          <QrCodeIcon className="size-8 text-muted-foreground" aria-hidden />
          <h1 className="type-sheet-title mt-3">No QR codes yet</h1>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-muted-foreground">
            Make one for your contact card, WhatsApp, LinkedIn, Instagram or any link. You can change where it goes later, even
            after it&rsquo;s printed.
          </p>
          <Link href="/settings/qr/new" className={cn(buttonVariants({ size: "touch-lg" }), "mt-6")}>
            Make a QR code
          </Link>
        </section>
      ) : (
        <>
          <div
            ref={track}
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          >
            {codes.map((code) => (
              <section
                key={code.id}
                aria-label={code.label}
                className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-6"
              >
                <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  <PurposeMark purpose={code.destination.purpose} className="size-7" />
                  {PURPOSE_META[code.destination.purpose].name}
                </p>
                <div className="mt-4 rounded-[28px] bg-[#fffaf0] p-4 shadow-card">
                  {origin ? (
                    <DesignedQr value={qrUrl(origin, code.slug)} purpose={code.destination.purpose} size={268} />
                  ) : (
                    <div className="size-[268px]" />
                  )}
                </div>
                <h1 className="type-heading mt-6 text-center">{code.label}</h1>
                {origin && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">{qrUrl(origin, code.slug).replace(/^https?:\/\//, "")}</p>
                )}
              </section>
            ))}
          </div>
          {codes.length > 1 && (
            <div className="flex justify-center gap-2 py-3" role="tablist" aria-label="Your codes">
              {codes.map((code, i) => (
                <button
                  key={code.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={code.label}
                  onClick={() => go(i)}
                  className="grid size-6 place-items-center"
                >
                  <span className={cn("size-2 rounded-full transition-colors", i === index ? "bg-primary" : "bg-border")} />
                </button>
              ))}
            </div>
          )}
          <p className="flex items-center justify-center gap-1.5 px-6 text-center text-sm text-muted-foreground">
            <SunIcon className="size-4" aria-hidden />
            Won&rsquo;t scan? Turn your screen brightness up.
          </p>
        </>
      )}
    </main>
  );
}
