import { QrCodeIcon } from "lucide-react";

// Someone scanned a code that was deleted (or never existed). They're a
// visitor, not a user, so there's nowhere in the app to send them.
export default function QrNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <QrCodeIcon className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="type-display">This code no longer works</h1>
      <p className="text-muted-foreground">
        Whoever shared it may have deleted or replaced it. Ask them for their new one.
      </p>
    </main>
  );
}
