import { Skeleton } from "@/components/ui/skeleton";

// Shown while the map and its people load.
export default function MapLoading() {
  return (
    <main className="relative h-[calc(100dvh-var(--tabbar-h)-1.5rem)]" aria-busy="true" aria-label="Loading map">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-background px-5 pt-4 pb-6 shadow-lg">
        <Skeleton className="mx-auto h-1.5 w-10 rounded-full" />
        <Skeleton className="mt-4 h-6 w-32" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
