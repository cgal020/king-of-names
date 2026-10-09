"use client";

import Link from "next/link";
import { CloudAlertIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

// A screen that couldn't load, usually the connection or the database for a
// moment. The tab bar stays, and recording still works offline.
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--tabbar-h))] max-w-md flex-col justify-center gap-4 px-6">
      <CloudAlertIcon className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="type-display">This didn&rsquo;t load</h1>
      <p className="text-muted-foreground">
        Check your connection and try again. Your people are safe, and you can still record notes; they&rsquo;re sent
        when you&rsquo;re back online.
      </p>
      <div className="mt-2 flex gap-3">
        <Button size="touch-lg" className="flex-[2]" onClick={() => retry()}>
          Try again
        </Button>
        <Link href="/capture" className={buttonVariants({ variant: "outline", size: "touch-lg", className: "flex-1" })}>
          Capture
        </Link>
      </div>
    </main>
  );
}
