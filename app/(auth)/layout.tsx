import { Toaster } from "@/components/ui/sonner";
import { authConfigured } from "@/lib/auth/config";
import { Wordmark } from "@/components/wordmark";

// Sign-in screens: one narrow column, the wordmark on top, no tab bar.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <Wordmark className="mb-10" />
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
