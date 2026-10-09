// Every recording is written here before it is sent and removed once the
// server has it, so closing the app mid-upload can't lose a note. Ones that
// couldn't be sent wait here and are retried when the app is opened, comes
// back online or becomes visible again. iOS has no Background Sync, so there
// is no retry while the app is closed. A retry of a note the server did get
// is harmless: the server keys captures on the id made on the phone.

export type QueuedCapture = {
  id: string;
  audio: Blob;
  mime: string;
  durationSeconds: number;
  recordedAt: string;
  timezone: string | null;
  location: { lat: number; lng: number; accuracyM: number | null } | null;
  attempts: number;
  lastError: string | null;
  // Set when the server refused the note for good (too large, wrong format).
  // It stays on the phone, out of the retries, until the user removes it.
  rejected?: string;
  // Set while the first upload is under way, so a background retry doesn't
  // send the same note alongside it. Past this time it counts as waiting.
  sendingUntil?: string;
};

// Mid-upload right now (see sendingUntil).
export const isSending = (item: QueuedCapture, now = Date.now()) =>
  Boolean(item.sendingUntil && Date.parse(item.sendingUntil) > now);

// Thrown by an upload when the server refuses the note itself, so sending it
// again can't help. Any other failure (no signal, server busy) is retried.
export class UploadRejected extends Error {
  name = "UploadRejected";
}

// How to treat the server's answer to an upload.
export function classifyUploadStatus(status: number): "sent" | "retry" | "rejected" {
  if (status >= 200 && status < 300) return "sent";
  // 408 timeout and 429 rate limit pass with time; so do server errors.
  if (status === 408 || status === 429 || status >= 500) return "retry";
  return "rejected";
}

export type QueueStore = {
  put: (item: QueuedCapture) => Promise<void>;
  all: () => Promise<QueuedCapture[]>;
  remove: (id: string) => Promise<void>;
};

type FlushResult = { sent: number; waiting: number; rejected: number };
const running = new WeakMap<QueueStore, Promise<FlushResult>>();

// Sends every waiting recording, oldest first. A failure keeps the recording
// and stops the run, since the rest would most likely fail the same way. A
// note the server refuses is marked and skipped, so it can't block the rest.
// Runs one at a time per store: "online" and "visibilitychange" can fire
// together, and two overlapping runs would upload the same recording twice.
export function flushQueue(
  store: QueueStore,
  upload: (item: QueuedCapture) => Promise<void>,
  now = Date.now(),
): Promise<FlushResult> {
  const previous = running.get(store);
  const next = (previous ? previous.catch(() => null) : Promise.resolve()).then(() => flushOnce(store, upload, now));
  running.set(store, next);
  return next;
}

async function flushOnce(
  store: QueueStore,
  upload: (item: QueuedCapture) => Promise<void>,
  now: number,
): Promise<FlushResult> {
  const all = (await store.all()).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const items = all.filter((item) => !item.rejected && !isSending(item, now));
  let sent = 0;
  let rejected = all.filter((item) => item.rejected).length;
  for (const [index, item] of items.entries()) {
    try {
      await upload(item);
      await store.remove(item.id);
      sent += 1;
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      if (error instanceof UploadRejected) {
        await store.put({ ...item, attempts: item.attempts + 1, lastError: name, rejected: error.message });
        rejected += 1;
        continue;
      }
      await store.put({ ...item, attempts: item.attempts + 1, lastError: name });
      return { sent, waiting: items.length - index, rejected };
    }
  }
  return { sent, waiting: 0, rejected };
}

export function memoryStore(): QueueStore {
  const items = new Map<string, QueuedCapture>();
  return {
    put: async (item) => void items.set(item.id, item),
    all: async () => [...items.values()],
    remove: async (id) => void items.delete(id),
  };
}

const DB = "king-of-names";
const STORE = "capture-queue";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

// Browser IndexedDB store. Asks the browser to keep it through storage
// pressure so a waiting recording isn't evicted.
export function indexedDbStore(): QueueStore {
  void navigator.storage?.persist?.().catch(() => false);
  return {
    put: (item) => run("readwrite", (s) => s.put(item)).then(() => undefined),
    all: () => run("readonly", (s) => s.getAll() as IDBRequest<QueuedCapture[]>),
    remove: (id) => run("readwrite", (s) => s.delete(id)).then(() => undefined),
  };
}
