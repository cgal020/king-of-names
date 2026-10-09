// Review failures, empty People and Ask, and the hourly limit message.
// Needs the dev server (or PWA_BASE_URL) and Google Chrome. Run all with: npm run check:flows
import { chromium, expect } from "@playwright/test";
const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.PWA_SHOTS;
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["microphone", "geolocation"],
    geolocation: { latitude: 25.0805, longitude: 55.1403, accuracy: 12 },
  });
  await context.addInitScript(() => localStorage.setItem("king-of-names:ai-consent", "yes"));
  const page = await context.newPage();

  await page.goto(BASE + "/capture/review?state=transcription-failed", { waitUntil: "networkidle" });
  await expect(page.getByText("We couldn’t turn this recording into text")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play recording" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/state-transcription-failed.png" });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Transcribed this time")).toBeVisible();
  await page.waitForURL(/\/capture\/review$/, { waitUntil: "commit" });
  await expect(page.locator("input").first()).toHaveValue("Sofia Haddad");
  pass("transcription failed: recording kept, Save waits for a name, Try again works");

  await page.goto(BASE + "/capture/review?state=extraction-failed", { waitUntil: "networkidle" });
  await expect(page.getByText("We couldn’t pick out the details")).toBeVisible();
  await expect(page.locator("details[open]").getByText(/Met Sofia Haddad at the rooftop bar/)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/state-extraction-failed.png", fullPage: true });
  pass("details failed: the transcript opens so the details can be typed from it");

  await page.goto(BASE + "/capture/review?state=place-failed", { waitUntil: "networkidle" });
  await expect(page.getByText("We couldn’t find the place name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Set city" })).toBeVisible();
  pass("place failed: asks for the city");

  await page.goto(BASE + "/people?state=empty", { waitUntil: "networkidle" });
  await expect(page.getByText("No one here yet")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/state-people-empty.png" });
  await page.goto(BASE + "/ask?state=empty", { waitUntil: "networkidle" });
  await expect(page.getByText("Nothing to ask about yet")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/state-ask-empty.png" });
  pass("empty People and Ask point to recording a first note");

  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await page.route("**/manifest.webmanifest", (r) =>
    r.request().method() === "HEAD" ? r.fulfill({ status: 429, headers: { "retry-after": "720" } }) : r.continue(),
  );
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByText("That’s 60 notes in the last hour")).toBeVisible();
  await expect(page.getByText("This one is saved on your phone and goes in about 12 minutes.")).toBeVisible();
  await expect(page.getByText("1 note waiting to send")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/state-rate-limit.png" });
  pass("the hourly limit keeps the note and says when it goes");

  await context.close();
} catch (e) {
  out.push("FAIL " + (e as Error).message.split("\n").slice(0, 6).join(" | "));
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log(out.join("\n"));
}
