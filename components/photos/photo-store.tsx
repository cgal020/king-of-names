"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { authConfigured } from "@/lib/auth/config";
import { mockPhotos } from "@/lib/mock/photos";
import type { Photo } from "@/lib/types";

// Every photo the screens show, kept in sync between them. With accounts
// connected, saved photos load from the server; a photo of someone already
// saved uploads straight away; photos taken for a note that isn't saved yet
// stay on the phone until it is (attachDraft), then upload. The preview keeps
// everything in memory.

type PhotoStore = {
  photos: Photo[];
  // Photos just picked, with their JPEG files for upload.
  add: (photos: Photo[], files: Map<string, Blob>) => void;
  update: (id: string, patch: Partial<Photo>) => void;
  remove: (id: string) => void;
  attachDraft: (captureId: string, personId: string | null) => void;
};

const PhotoContext = createContext<PhotoStore | null>(null);
// Signed links last an hour; fetch fresh ones a little before.
const REFRESH_MS = 50 * 60_000;

async function uploadPhoto(photo: Photo, file: Blob): Promise<Photo> {
  const form = new FormData();
  form.set("photo", file, `${photo.id}.jpg`);
  const fields: Record<string, string | number | null> = {
    id: photo.id,
    person_id: photo.person_id,
    kind: photo.kind,
    width: photo.width,
    height: photo.height,
    taken_at: photo.taken_at,
    taken_timezone: photo.taken_timezone,
    lat: photo.lat,
    lng: photo.lng,
    location_accuracy_m: photo.location_accuracy_m,
    location_source: photo.location_source,
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value === null ? "" : String(value));
  const response = await fetch("/api/photos", { method: "POST", body: form });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.photo) throw new Error(body?.error ?? "Upload failed");
  return body.photo as Photo;
}

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const real = authConfigured();
  const [photos, setPhotos] = useState<Photo[]>(() => (real ? [] : mockPhotos));
  // Files of photos not uploaded yet, by photo id.
  const files = useRef(new Map<string, Blob>());
  // The latest list, for actions that read it before changing it.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });

  useEffect(() => {
    if (!real) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/photos", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { photos: [] }))
        .then((json: { photos?: Photo[] }) => {
          if (cancelled) return;
          // Saved photos from the server, plus any still only on this phone.
          setPhotos((list) => [...(json.photos ?? []), ...list.filter((p) => files.current.has(p.id))]);
        })
        .catch(() => {});
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [real]);

  const upload = useCallback((photo: Photo) => {
    const file = files.current.get(photo.id);
    if (!file || !photo.person_id) return;
    void uploadPhoto(photo, file)
      .then((saved) => {
        files.current.delete(photo.id);
        URL.revokeObjectURL(photo.url);
        setPhotos((list) => list.map((p) => (p.id === photo.id ? saved : p)));
      })
      .catch(() => {
        toast.error("A photo didn’t upload", { description: "Check your connection and add it again." });
        files.current.delete(photo.id);
        setPhotos((list) => list.filter((p) => p.id !== photo.id));
      });
  }, []);

  const add = useCallback(
    (added: Photo[], picked: Map<string, Blob>) => {
      if (real) for (const [id, file] of picked) files.current.set(id, file);
      setPhotos((list) => [...list, ...added]);
      if (real) added.filter((p) => p.person_id).forEach(upload);
    },
    [real, upload],
  );

  const update = useCallback(
    (id: string, patch: Partial<Photo>) => {
      setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      if (real && patch.kind && !files.current.has(id)) {
        void fetch(`/api/photos/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: patch.kind }),
        }).catch(() => toast.error("That change didn’t save"));
      }
    },
    [real],
  );

  const remove = useCallback(
    (id: string) => {
      setPhotos((list) => list.filter((p) => p.id !== id));
      if (!real) return;
      if (files.current.delete(id)) return;
      void fetch(`/api/photos/${id}`, { method: "DELETE" }).catch(() => toast.error("That photo wasn’t deleted"));
    },
    [real],
  );

  // On save, draft photos move to the person (and upload); on discard
  // (personId null) they go. Uploads start outside the state update, which
  // React may run twice.
  const attachDraft = useCallback(
    (captureId: string, personId: string | null) => {
      const drafts = photosRef.current.filter((p) => p.capture_id === captureId && !p.person_id);
      const ids = new Set(drafts.map((p) => p.id));
      if (!personId) {
        drafts.forEach((p) => files.current.delete(p.id));
        setPhotos((list) => list.filter((p) => !ids.has(p.id)));
        return;
      }
      const moved = drafts.map((p) => ({ ...p, person_id: personId, capture_id: null }));
      setPhotos((list) => list.map((p) => moved.find((m) => m.id === p.id) ?? p));
      if (real) moved.forEach(upload);
    },
    [real, upload],
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
