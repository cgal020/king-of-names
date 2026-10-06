import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <p className="bg-muted py-1 text-center text-xs text-muted-foreground">
        Preview with sample data. Nothing is saved.
      </p>
      <div className="pb-(--tabbar-h)">{children}</div>
      <TabBar />
      <Toaster position="top-center" />
    </>
  );
}
