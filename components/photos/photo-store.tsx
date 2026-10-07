"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { mockPhotos } from "@/lib/mock/photos";
import type { Photo } from "@/lib/types";

// Mockup only: keeps photos in memory for the session so screens stay in
// sync. The real app reads and writes the `photos` table instead.

type PhotoStore = {
  photos: Photo[];
  add: (photos: Photo[]) => void;
  update: (id: string, patch: Partial<Photo>) => void;
  remove: (id: string) => void;
  attachDraft: (captureId: string, personId: string | null) => void;
};

const PhotoContext = createContext<PhotoStore | null>(null);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);

  const add = useCallback((added: Photo[]) => setPhotos((list) => [...list, ...added]), []);
  const update = useCallback(
    (id: string, patch: Partial<Photo>) =>
      setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );
  const remove = useCallback((id: string) => setPhotos((list) => list.filter((p) => p.id !== id)), []);
  // On save, draft photos move to the person; on discard (personId null) they go.
  const attachDraft = useCallback(
    (captureId: string, personId: string | null) =>
      setPhotos((list) =>
        personId
          ? list.map((p) => (p.capture_id === captureId && !p.person_id ? { ...p, person_id: personId } : p))
          : list.filter((p) => !(p.capture_id === captureId && !p.person_id)),
      ),
    [],
  );

  const value = useMemo(() => ({ photos, add, update, remove, attachDraft }), [photos, add, update, remove, attachDraft]);
  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
}

export function usePhotos() {
  const store = useContext(PhotoContext);
  if (!store) throw new Error("usePhotos must be used inside PhotoProvider");
  return store;
}

// Photos for one person, or for an unsaved capture draft.
export function usePhotosFor(target: { personId?: string | null; captureId?: string | null }) {
  const { photos } = usePhotos();
  return useMemo(
    () =>
      photos.filter((p) =>
        target.personId ? p.person_id === target.personId : p.capture_id === target.captureId && !p.person_id,
      ),
    [photos, target.personId, target.captureId],
  );
}

// The newest photo marked as the person themselves.
export function useAvatar(personId: string) {
  const { photos } = usePhotos();
  return useMemo(
    () =>
      photos
        .filter((p) => p.person_id === personId && p.kind === "person")
        .sort((a, b) => (b.taken_at ?? "").localeCompare(a.taken_at ?? ""))[0] ?? null,
    [photos, personId],
  );
}
