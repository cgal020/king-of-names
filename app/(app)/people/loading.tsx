import { Skeleton } from "@/components/ui/skeleton";

// Shown while the people list loads.
export default function PeopleLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 pb-8" aria-busy="true" aria-label="Loading people">
      <div className="flex min-h-14 items-center justify-between pt-[env(safe-area-inset-top)]">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <Skeleton className="mt-2 h-12 w-full rounded-xl" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-8 h-4 w-28" />
      <ul className="mt-3 divide-y">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
