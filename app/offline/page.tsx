import Link from "next/link";
import { WifiOffIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shown by the service worker when a page can't load without a connection.
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <WifiOffIcon className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-3xl font-semibold tracking-tight">You&rsquo;re offline</h1>
      <p className="text-muted-foreground">
        You can still record notes. They stay on your phone and are sent as soon as you&rsquo;re back online.
      </p>
      <Link href="/capture" className={cn(buttonVariants({ size: "touch-lg" }), "mt-2")}>
        Record a note
      </Link>
    </main>
  );
}
