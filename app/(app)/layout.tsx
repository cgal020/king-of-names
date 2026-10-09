import { AppProviders } from "@/components/app-providers";
import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <p className="bg-muted py-1 text-center text-xs text-muted-foreground">
        Preview with sample data. Nothing is saved.
      </p>
      <div className="pb-(--tabbar-h)">{children}</div>
      <TabBar />
      <Toaster />
    </AppProviders>
  );
}
