import { CardProvider } from "@/components/capture/card-store";
import { PhotoProvider } from "@/components/photos/photo-store";
import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhotoProvider>
      <CardProvider>
        <p className="bg-muted py-1 text-center text-xs text-muted-foreground">
          Preview with sample data. Nothing is saved.
        </p>
        <div className="pb-(--tabbar-h)">{children}</div>
        <TabBar />
        <Toaster position="top-center" />
      </CardProvider>
    </PhotoProvider>
  );
}
