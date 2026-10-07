// PeopleMap service worker: opens instantly and works offline for capture.
// It caches only the app shell (the Capture screen, the offline page and the
// build files they need). Pages and API responses with people's details are
// never cached; recordings made offline wait in IndexedDB, not here.

const VERSION = "v2";
const SHELL = `shell-${VERSION}`;
const STATIC = `static-${VERSION}`;
const SHELL_PAGES = ["/capture", "/offline"];
const SHELL_FILES = ["/manifest.webmanifest", "/icons/icon-192.png"];

// Build files referenced by a page or stylesheet. Inline scripts escape their
// quotes, so a backslash ends a match too.
const ASSET = /\/_next\/static\/[^"'\s\\)]+/g;
const assetsIn = (text) => text.match(ASSET) ?? [];
const keyOf = (request) => {
  const url = new URL(request.url);
  return url.pathname + url.search;
};

// Saves a shell page and every build file it needs, so it works offline even
// though it first loaded before this worker was in control. Then drops build
// files that no shell page uses any more (earlier deploys).
async function saveShellPage(path, response) {
  const shell = await caches.open(SHELL);
  await shell.put(path, response);

  const pages = await Promise.all(SHELL_PAGES.map((p) => shell.match(p).then((r) => r?.text() ?? "")));
  const statics = await caches.open(STATIC);
  const needed = new Set(pages.flatMap(assetsIn));
  const queue = [...needed];
  while (queue.length) {
    const url = queue.shift();
    let file = await statics.match(url);
    if (!file) {
      const fetched = await fetch(url).catch(() => null);
      if (!fetched?.ok) continue;
      await statics.put(url, fetched.clone());
      file = fetched;
    }
    // Stylesheets point at fonts.
    if (url.split("?")[0].endsWith(".css")) {
      for (const font of assetsIn(await file.text())) {
        if (needed.has(font)) continue;
        needed.add(font);
        queue.push(font);
      }
    }
  }

  for (const request of await statics.keys()) {
    const key = keyOf(request);
    if (key.startsWith("/_next/static/") && !needed.has(key)) await statics.delete(request);
  }
}

// A page is only kept when it really is that page: a redirect (to sign-in,
// say) or an error is never stored as the offline copy.
const usable = (response) => response.ok && !response.redirected;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await (await caches.open(SHELL)).addAll(SHELL_FILES);
      for (const path of SHELL_PAGES) {
        const response = await fetch(path);
        if (usable(response)) await saveShellPage(path, response);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache data: API routes, React Server Component payloads, auth.
  if (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc") || request.headers.get("RSC")) return;

  // Build files have content hashes in their names, so a cached copy is
  // always right.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Pages: always from the network. Each online visit to Capture refreshes
  // its offline copy. Offline, Capture opens from that copy and every other
  // page shows the offline screen.
  if (request.mode === "navigate") {
    const isCapture = url.pathname === "/" || url.pathname === "/capture";
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (url.pathname === "/capture" && usable(response)) {
            event.waitUntil(saveShellPage("/capture", response.clone()).catch(() => {}));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL);
          return (await cache.match(isCapture ? "/capture" : "/offline")) ?? Response.error();
        }),
    );
  }
});
