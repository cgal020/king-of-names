import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// A link to a person, note or code that doesn't exist, or was deleted.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <SearchXIcon className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="type-display">Nothing here</h1>
      <p className="text-muted-foreground">That page doesn&rsquo;t exist, or what it showed was deleted.</p>
      <Link href="/people" className={buttonVariants({ size: "touch-lg", className: "mt-2" })}>
        Go to People
      </Link>
    </main>
  );
}
