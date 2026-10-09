"use client";

import { AskProvider } from "@/components/ask/ask-store";
import { CaptureQueueProvider } from "@/components/capture/capture-queue";
import { CardProvider } from "@/components/capture/card-store";
import { RecordingProvider } from "@/components/capture/recording-store";
import { PhotoProvider } from "@/components/photos/photo-store";

// Session state shared between screens: photos, scanned cards, the question
// handed to Ask, the latest recording, and the queue of notes waiting to send.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PhotoProvider>
      <CardProvider>
        <AskProvider>
          <RecordingProvider>
            <CaptureQueueProvider>{children}</CaptureQueueProvider>
          </RecordingProvider>
        </AskProvider>
      </CardProvider>
    </PhotoProvider>
  );
}
