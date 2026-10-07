"use client";

import { AskProvider } from "@/components/ask/ask-store";
import { CardProvider } from "@/components/capture/card-store";
import { RecordingProvider } from "@/components/capture/recording-store";
import { PhotoProvider } from "@/components/photos/photo-store";

// Session state shared between screens: photos, scanned cards, the question
// handed to Ask, and the latest recording.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PhotoProvider>
      <CardProvider>
        <AskProvider>
          <RecordingProvider>{children}</RecordingProvider>
        </AskProvider>
      </CardProvider>
    </PhotoProvider>
  );
}
