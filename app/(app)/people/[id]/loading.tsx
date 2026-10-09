import { Skeleton } from "@/components/ui/skeleton";

// Shown while a profile loads.
export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 pb-8" aria-busy="true" aria-label="Loading profile">
      <div className="flex min-h-14 items-center justify-between pt-[env(safe-area-inset-top)]">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-4/5" />
      <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="mt-8 h-44 w-full rounded-2xl" />
    </main>
  );
}
