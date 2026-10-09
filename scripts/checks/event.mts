// Event mode: quick takes, reload, weak signal, review, Review later, Done, a take cut off mid-upload.
// Needs the dev server (or PWA_BASE_URL) and Google Chrome. Run all with: npm run check:flows
import { chromium, expect, type Page } from "@playwright/test";
const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.PWA_SHOTS;
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });

async function take(page: Page) {
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Stop recording" }).click();
}

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["microphone", "geolocation"],
    geolocation: { latitude: 25.1424, longitude: 55.2259, accuracy: 14 },
  });
  await context.addInitScript(() => localStorage.setItem("king-of-names:ai-consent", "yes"));
  const page = await context.newPage();
  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Event mode" }).click();
  const sheet = page.getByRole("dialog", { name: "Going somewhere busy?" });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel("Name this event").fill("Gallery night");
  if (SHOTS) await page.screenshot({ path: SHOTS + "/event-start.png" });
  await sheet.getByRole("button", { name: "Start event mode" }).click();
  await expect(page.getByText("Event mode · Gallery night")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who’s next?" })).toBeVisible();
  pass("event starts from Capture with its own name and heading");

  await take(page);
  await expect(page.getByText("Take 1 saved")).toBeVisible();
  expect(page.url()).toBe(BASE + "/capture");
  await take(page);
  await expect(page.getByText("Take 2 saved")).toBeVisible();
  await page.waitForTimeout(1500); // let both uploads finish
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Event mode · Gallery night")).toBeVisible();
  await expect(page.getByText("2 takes saved. Review them when it’s over.")).toBeVisible();
  pass("the event and its takes survive the app being reloaded");

  // Weak signal for the third take: the upload fails, so it waits on the phone.
  const upload = "**/manifest.webmanifest";
  await page.route(upload, (r) => (r.request().method() === "HEAD" ? r.abort("timedout") : r.continue()));
  await take(page);
  await expect(page.getByText("Take 3 saved")).toBeVisible();
  await expect(page.getByText("3 takes saved. Review them when it’s over.")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/event-live.png" });
  pass("each tap saves a take with no processing screen, even when sending fails");

  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.waitForURL("**/capture/event");
  await expect(page.getByRole("heading", { name: "Gallery night" })).toBeVisible();
  await expect(page.getByText(/^Waiting to send/)).toHaveCount(1);
  await page.waitForTimeout(3200);
  await expect(page.getByText("Layla Nasser")).toBeVisible();
  await expect(page.getByText("Karim Aziz")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/event-takes.png" });
  pass("ending shows every take; sent takes become ready, the offline one waits");

  await page.unroute(upload);
  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await expect(page.getByText("Waiting note sent")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("3 notes need review")).toBeVisible();
  await expect(page.getByText("From Gallery night")).toBeVisible();
  pass("back online the waiting take is sent; Capture shows 3 notes need review");

  await page.getByText("3 notes need review").click();
  await page.waitForURL("**/capture/event");
  await page.waitForTimeout(3000);
  await page.getByRole("link", { name: "Review next" }).click();
  await page.waitForURL("**/capture/review?capture=*");
  await expect(page.getByText(/Take 1 of 3 · Gallery night/)).toBeVisible();
  await expect(page.locator("input").first()).toHaveValue("Layla Nasser");
  await expect(page.locator("audio")).toHaveCount(0); // reloaded, so no in-memory recording
  if (SHOTS) await page.screenshot({ path: SHOTS + "/event-review.png" });
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/capture/event");
  await expect(page.getByText("Saved ·").first()).toBeVisible();
  await expect(page.getByText("3 takes · 2 to review")).toBeVisible();
  pass("reviewing a take saves it and returns to the list");

  await page.getByRole("link", { name: "Review later" }).click();
  await page.waitForURL("**/capture");
  await expect(page.getByText("2 notes need review")).toBeVisible();
  pass("Review later leaves the rest under needs review");

  for (let i = 0; i < 2; i++) {
    await page.goto(BASE + "/capture/event", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Review next" }).click();
    await page.waitForURL("**/capture/review?capture=*");
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /Discard/ }).click();
    await page.waitForURL("**/capture/event");
  }
  await expect(page.getByText("all reviewed")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await page.waitForURL("**/capture");
  await expect(page.getByText("1 note needs review")).toBeVisible(); // back to the sample strip
  await expect(page.getByText("Event mode ·")).toHaveCount(0);
  pass("discarding the rest and tapping Done closes the event");

  // Closing the app while a take is still uploading doesn't lose it.
  await page.getByRole("button", { name: "Event mode" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start event mode" }).click();
  await page.route("**/manifest.webmanifest", async (r) => {
    if (r.request().method() !== "HEAD") return r.continue();
    await new Promise((resolve) => setTimeout(resolve, 4000)); // a slow upload
    return r.continue().catch(() => {}); // the reload already cut it off
  });
  await take(page);
  await expect(page.getByText("Take 1 saved")).toBeVisible();
  await page.unroute("**/manifest.webmanifest");
  await page.reload({ waitUntil: "networkidle" }); // mid-upload
  const kept = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open("king-of-names", 1);
        req.onsuccess = () => {
          const all = req.result.transaction("capture-queue").objectStore("capture-queue").getAll();
          all.onsuccess = () => resolve(all.result.length);
        };
      }),
  );
  expect(kept).toBe(1);
  await expect(page.getByText(/notes? waiting to send/)).toHaveCount(0); // held back, not shown as waiting
  await page.goto(BASE + "/capture/event", { waitUntil: "networkidle" });
  await expect(page.getByText("Layla Nasser")).toBeVisible({ timeout: 45000 });
  pass("a take cut off by closing the app stays on the phone and is sent by the retry");

  await context.close();
} catch (e) {
  out.push("FAIL " + (e as Error).message.split("\n").slice(0, 6).join(" | "));
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log(out.join("\n"));
}
