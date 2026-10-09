import { AppProviders } from "@/components/app-providers";
import { AiConsentProvider } from "@/components/capture/ai-consent";
import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/ui/sonner";
import { authConfigured } from "@/lib/auth/config";
import { getAiConsent } from "@/lib/data/account";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AiConsentProvider account={await getAiConsent()}>
        {!authConfigured() && (
          <p className="bg-muted py-1 text-center text-xs text-muted-foreground">
            Preview with sample data. Nothing is saved.
          </p>
        )}
        <div className="pb-(--tabbar-h)">{children}</div>
        <TabBar />
        <Toaster />
      </AiConsentProvider>
    </AppProviders>
  );
}
