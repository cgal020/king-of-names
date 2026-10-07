// Checks the installable app and offline capture in Chrome with a simulated
// microphone: real recording, the offline queue, weak signal, the Record
// shortcut, the manifest and the install help. Needs Google Chrome.
//
// Against the dev server:       npm run check:pwa
// With the service worker too:  npm run build && npm start -- -p 3100
//                               PWA_BASE_URL=http://localhost:3100 npm run check:pwa -- --prod
// Set PWA_SHOTS=<folder> to save screenshots of each state.
import { mkdir } from "node:fs/promises";
import { chromium, devices, expect, type Browser, type BrowserContextOptions, type Page } from "@playwright/test";

const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.PWA_SHOTS;
const PROD = process.argv.includes("--prod");

const results: string[] = [];
const pass = (message: string) => results.push(`PASS ${message}`);
const info = (message: string) => results.push(`INFO ${message}`);

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function open(browser: Browser, options: BrowserContextOptions = {}, coachDismissed = false) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"], ...options });
  await context.addInitScript((dismissed) => {
    localStorage.setItem("peoplemap:ai-consent", "yes");
    if (dismissed) localStorage.setItem("peoplemap:install-coach-dismissed", "yes");
  }, coachDismissed);
  return { context, page: await context.newPage() };
}

async function record(page: Page, ms: number) {
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(ms);
  await page.getByRole("button", { name: "Stop recording" }).click();
}

async function recordingReachesReview(browser: Browser) {
  const { context, page } = await open(browser);
  await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
  await record(page, 2000);
  await page.waitForURL("**/capture/review", { timeout: 15_000 });
  await expect(page.locator("audio")).toHaveCount(1);
  pass("a real recording reaches Review with playback");
  await context.close();
}

async function offlineQueue(browser: Browser) {
  const { context, page } = await open(browser);
  await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
  await context.setOffline(true);
  await record(page, 1500);
  await expect(page.getByText("Saved on your phone")).toBeVisible();
  await expect(page.getByText("1 note waiting to send")).toBeVisible();
  expect(page.url()).toBe(`${BASE}/capture`);
  await shot(page, "offline-waiting");
  pass("offline: the note is saved on the phone and Capture stays open");

  await record(page, 1500);
  await expect(page.getByText("2 notes waiting to send")).toBeVisible();
  await context.setOffline(false);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("2 waiting notes sent")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await expect(page.getByText(/waiting notes? sent/)).toHaveCount(1);
  pass("waiting notes survive a reload and send once, with one toast");
  await context.close();
}

async function weakSignal(browser: Browser) {
  // Online as far as the browser knows, but the upload fails.
  const { context, page } = await open(browser, { serviceWorkers: "block" });
  await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
  const failUpload = "**/manifest.webmanifest"; // the mockup's stand-in for POST /api/captures
  await page.route(failUpload, (r) => (r.request().method() === "HEAD" ? r.abort("timedout") : r.continue()));
  await record(page, 1500);
  await expect(page.getByText("1 note waiting to send")).toBeVisible();
  pass("weak signal: a failed upload keeps the note instead of losing it");
  await page.unroute(failUpload);
  await page.getByRole("button", { name: "Send now" }).click();
  await expect(page.getByText("Waiting note sent")).toBeVisible({ timeout: 10_000 });
  pass("Send now sends it once the connection is good");
  await context.close();
}

async function recordShortcut(browser: Browser) {
  const { context, page } = await open(browser);
  await page.goto(`${BASE}/capture?record=1`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Stop recording" })).toBeVisible({ timeout: 5000 });
  expect(new URL(page.url()).search).toBe("");
  await page.waitForTimeout(1200);
  await shot(page, "shortcut-recording");
  await page.getByRole("button", { name: "Stop recording" }).click();
  await page.waitForURL("**/capture/review", { timeout: 15_000 });
  pass("the Record shortcut starts recording at once and cleans the address");
  await context.close();
}

async function manifest(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.request.get(`${BASE}/manifest.webmanifest`);
  expect(response.status()).toBe(200);
  const m = await response.json();
  expect(m).toMatchObject({ display: "standalone", start_url: "/capture" });
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  for (const path of [...m.icons.map((i: { src: string }) => i.src), "/apple-icon.png", "/sw.js", "/offline"]) {
    expect((await page.request.get(BASE + path)).status(), path).toBe(200);
  }
  expect((await page.request.get(`${BASE}/sw.js`)).headers()["cache-control"]).toContain("no-cache");
  info(`shortcuts: ${m.shortcuts.map((s: { url: string }) => s.url).join(", ")}`);
  pass("manifest, icons, Apple icon, offline page and service worker are served");
  await context.close();
}

async function installHelp(browser: Browser) {
  {
    const { context, page } = await open(browser, { ...devices["iPhone 15"], permissions: [] });
    await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
    await expect(page.getByText(/to your Home Screen/)).toBeVisible();
    // Safari's toolbars leave 659 px; the record button must stay in view.
    const button = (await page.getByRole("button", { name: "Start recording" }).boundingBox())!;
    const tabBar = (await page.getByRole("navigation").last().boundingBox())!;
    expect(button.y + button.height).toBeLessThanOrEqual(tabBar.y);
    await shot(page, "install-iphone");
    await page.getByRole("button", { name: "How" }).click();
    const sheet = page.getByRole("dialog", { name: /to your Home Screen/ });
    await expect(sheet.getByText(/Add to Home\s+Screen/)).toBeVisible();
    await shot(page, "install-iphone-steps");
    await sheet.getByRole("button", { name: "Got it" }).click();
    await page.getByRole("button", { name: "Not now" }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await expect(page.getByText(/to your Home Screen/)).toHaveCount(0);
    pass("iPhone: a one-line prompt, an instruction screen, and it stays dismissed");
    await context.close();
  }
  {
    const { context, page } = await open(browser, { ...devices["Pixel 7"], permissions: [] });
    await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "How" }).click();
    await expect(page.getByRole("dialog").getByText(/Install app/)).toBeVisible();
    pass("Android: menu steps until Chrome offers its install prompt");
    await context.close();
  }
  {
    const { context, page } = await open(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}/capture`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await expect(page.getByText(/to your Home Screen/)).toHaveCount(0);
    pass("desktop: no install prompt");
    await context.close();
  }
}

// Production build only: the service worker registers there.
async function serviceWorker(browser: Browser) {
  const { context, page } = await open(browser, devices["iPhone 15"], true);
  // First visit is not Capture, so its files load before the worker exists.
  await page.goto(`${BASE}/people`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10_000 });
  const cached = await page.evaluate(async () => {
    const keys: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) keys.push(new URL(request.url).pathname);
    }
    return keys;
  });
  expect(cached.filter((k) => k.startsWith("/api/") || k.startsWith("/people"))).toEqual([]);
  info(`cached: ${cached.length} files`);
  pass("the worker caches the shell and nothing with people's details");

  // Clearing Chrome's own cache leaves only the worker to serve files. The
  // extra debugging session also leaves navigator.onLine true while offline,
  // which is how a weak signal behaves.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.clearBrowserCache");
  await context.setOffline(true);
  await page.goto(`${BASE}/capture`, { waitUntil: "load" });
  await record(page, 1500);
  await expect(page.getByText("1 note waiting to send")).toBeVisible();
  await shot(page, "offline-capture-prod");
  pass("offline: Capture opens from the worker, records and keeps the note");

  await page.goto(`${BASE}/people`, { waitUntil: "load" });
  await expect(page.getByText("You’re offline")).toBeVisible();
  await page.getByRole("link", { name: "Record a note" }).click();
  await expect(page.getByText("Who did you just meet?")).toBeVisible({ timeout: 10_000 });
  pass("offline: other pages show the offline screen, which leads back to Capture");

  await context.setOffline(false);
  await expect(page.getByText("Waiting note sent")).toBeVisible({ timeout: 40_000 });
  pass("back online with no online event: the 30 second retry sends the note");
  await context.close();
}

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
let failed = false;
try {
  if (SHOTS) await mkdir(SHOTS, { recursive: true });
  await recordingReachesReview(browser);
  await offlineQueue(browser);
  await weakSignal(browser);
  await recordShortcut(browser);
  await manifest(browser);
  await installHelp(browser);
  if (PROD) await serviceWorker(browser);
} catch (error) {
  failed = true;
  results.push(`FAIL ${(error as Error).message.split("\n").slice(0, 6).join(" | ")}`);
} finally {
  await browser.close();
  console.log(results.join("\n"));
  if (failed) process.exitCode = 1;
}
