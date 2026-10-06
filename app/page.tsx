import { appConfig } from "@/lib/config";

// Placeholder until milestone 2 adds sign-in and the capture screen.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-3 px-6 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="size-3 rounded-full bg-primary" aria-hidden />
      <h1 className="text-4xl font-semibold tracking-tight">{appConfig.name}</h1>
      <p className="text-muted-foreground">{appConfig.description}</p>
    </main>
  );
}
