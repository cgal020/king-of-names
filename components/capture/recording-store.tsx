"use client";

import { createContext, useContext, useMemo, useState } from "react";

// The latest recording, so the review screen can play back what was said.
// The real app plays it from a short-lived signed URL instead.

export type LocalRecording = { url: string; durationSeconds: number };

type RecordingStore = {
  recording: LocalRecording | null;
  setRecording: (recording: LocalRecording | null) => void;
};

const RecordingContext = createContext<RecordingStore | null>(null);

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [recording, setRecordingState] = useState<LocalRecording | null>(null);
  const value = useMemo(
    () => ({
      recording,
      setRecording: (next: LocalRecording | null) =>
        setRecordingState((previous) => {
          if (previous && previous.url !== next?.url) URL.revokeObjectURL(previous.url);
          return next;
        }),
    }),
    [recording],
  );
  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

export function useRecording() {
  const store = useContext(RecordingContext);
  if (!store) throw new Error("useRecording must be used inside RecordingProvider");
  return store;
}
