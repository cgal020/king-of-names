import { Toaster } from "@/components/ui/sonner";
import { authConfigured } from "@/lib/auth/config";
import { appConfig } from "@/lib/config";

// Sign-in screens: one narrow column, the app's mark on top, no tab bar.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-8 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 40 px icon, cached for offline */}
        <img src="/icons/icon-192.png" alt="" width={40} height={40} className="size-10 rounded-[10px]" />
        <span className="text-lg font-semibold tracking-tight">{appConfig.name}</span>
      </div>
      {!authConfigured() && (
        <p className="mb-6 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Preview: accounts aren&rsquo;t connected yet, so any details that pass the checks open the app with
          sample data.
        </p>
      )}
      {children}
      <Toaster position="top-center" />
    </main>
  );
}
