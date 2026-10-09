// Captures every screen and key state at phone size, light and dark, for
// design reviews. Needs the dev server running and Google Chrome installed.
// Run with: npm run screenshots
import { mkdir } from "node:fs/promises";
import { chromium, devices, type Page } from "@playwright/test";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT = "docs/design-handoff/screens";

type Shot = {
  name: string;
  path: string;
  fullPage?: boolean;
  act?: (page: Page) => Promise<void>;
  // Shots that change the browser (an iPhone, offline) get a context of their own.
  isolated?: { userAgent?: string; offline?: boolean };
};

const IPHONE = devices["iPhone 15"].userAgent;

const SHOTS: Shot[] = [
  { name: "01-capture", path: "/capture" },
  {
    name: "02-capture-recording",
    path: "/capture",
    act: async (p) => {
      await p.getByRole("button", { name: "Start recording" }).click();
      await p.waitForTimeout(2600);
    },
  },
  {
    name: "03-capture-processing",
    path: "/capture",
    act: async (p) => {
      await p.getByRole("button", { name: "Start recording" }).click();
      await p.waitForTimeout(1500);
      await p.getByRole("button", { name: "Stop recording" }).click();
      await p.waitForTimeout(900);
    },
  },
  { name: "04-review", path: "/capture/review" },
  { name: "05-review-full", path: "/capture/review", fullPage: true },
  {
    name: "06-review-discard-confirm",
    path: "/capture/review",
    act: async (p) => {
      await p.getByRole("button", { name: "Discard" }).click();
      await p.waitForTimeout(300);
    },
  },
  { name: "07-people", path: "/people" },
  {
    name: "08-people-search",
    path: "/people",
    act: async (p) => {
      await p.getByRole("searchbox", { name: "Search people" }).fill("logistics");
      await p.waitForTimeout(200);
    },
  },
  { name: "09-profile-full", path: "/people/zayed-khoury", fullPage: true },
  { name: "10-profile-no-gps", path: "/people/isabella-rossi", fullPage: true },
  { name: "11-add-person", path: "/people/new" },
  { name: "12-edit-person-full", path: "/people/priya-raman/edit", fullPage: true },
  { name: "13-map-cities", path: "/map" },
  {
    name: "14-map-city",
    path: "/map",
    act: async (p) => {
      await p.getByRole("button", { name: /^Dubai: / }).click();
      await p.waitForTimeout(900);
    },
  },
  {
    name: "15-map-person-card",
    path: "/map",
    act: async (p) => {
      await p.getByRole("button", { name: /^Dubai: / }).click();
      await p.waitForTimeout(900);
      await p.getByRole("button", { name: "Show Priya Raman on the map" }).click();
      await p.waitForTimeout(400);
    },
  },
  {
    name: "16-map-near-me",
    path: "/map",
    act: async (p) => {
      await p.getByRole("button", { name: "Near me" }).click();
      await p.waitForTimeout(900);
      await p.getByRole("radio", { name: "25 km" }).click();
      await p.waitForTimeout(900);
    },
  },
  { name: "17-settings-full", path: "/settings", fullPage: true },
  { name: "18-card-scanner", path: "/capture/card" },
  {
    name: "19-card-result-qr",
    path: "/capture/card",
    act: async (p) => {
      // A business card QR holding a vCard (tests/fixtures/qr-vcard.txt).
      await p.locator("input[type=file]").setInputFiles("tests/fixtures/qr-vcard.png");
      await p.getByText("Read from the QR code").waitFor();
    },
  },
  {
    name: "20-review-from-card-full",
    path: "/capture/card",
    fullPage: true,
    act: async (p) => {
      await p.locator("input[type=file]").setInputFiles("tests/fixtures/qr-vcard.png");
      await p.getByRole("button", { name: "Add to note" }).click();
      await p.waitForURL("**/capture/review");
      await p.waitForTimeout(400);
    },
  },
  {
    name: "21-photo-viewer",
    path: "/people/zayed-khoury",
    act: async (p) => {
      await p.getByRole("button", { name: /^Card photo/ }).click();
      await p.waitForTimeout(300);
    },
  },
  { name: "22-ask-tab", path: "/ask" },
  {
    name: "23-people-question-row",
    path: "/people",
    act: async (p) => {
      await p.getByRole("searchbox", { name: "Search people" }).fill("Who did I meet in Dubai who works in shipping?");
      await p.waitForTimeout(200);
    },
  },
  {
    name: "24-ask-thinking",
    path: "/ask",
    act: async (p) => {
      await p.getByRole("button", { name: "Who do I know in Bangkok?" }).click();
      await p.waitForTimeout(300);
    },
  },
  {
    name: "26-review-tags",
    path: "/capture/review",
    act: async (p) => {
      await p.getByRole("group", { name: "How they could help" }).scrollIntoViewIfNeeded();
      await p.waitForTimeout(200);
    },
  },
  {
    name: "27-people-tag-filter",
    path: "/people",
    act: async (p) => {
      await p.getByRole("combobox", { name: "Tag" }).selectOption("Investor");
      await p.waitForTimeout(200);
    },
  },
  {
    name: "29-card-link-only",
    path: "/capture/card",
    act: async (p) => {
      // A Blinq QR, which holds only a profile link (tests/fixtures/qr-blinq-link.txt).
      await p.locator("input[type=file]").setInputFiles("tests/fixtures/qr-blinq-link.png");
      await p.getByText("This QR only links to their Blinq profile").waitFor();
    },
  },
  {
    name: "30-photo-permission",
    path: "/people/omar-al-mansouri",
    act: async (p) => {
      await p.getByRole("button", { name: "Add photo" }).click();
      await p.getByRole("button", { name: "Them" }).click();
      await p.getByRole("alertdialog").scrollIntoViewIfNeeded();
      await p.waitForTimeout(200);
    },
  },
  {
    name: "31-ai-consent",
    path: "/capture",
    act: async (p) => {
      await p.evaluate(() => localStorage.removeItem("king-of-names:ai-consent"));
      await p.getByRole("button", { name: "Start recording" }).click();
      await p.waitForTimeout(300);
    },
  },
  { name: "32-profile-meetings-full", path: "/people/omar-al-mansouri", fullPage: true },
  {
    name: "33-met-again",
    path: "/people/omar-al-mansouri",
    act: async (p) => {
      await p.getByRole("button", { name: "Met again" }).click();
      await p.getByRole("textbox", { name: "Note about this meeting" }).scrollIntoViewIfNeeded();
      await p.waitForTimeout(200);
    },
  },
  {
    name: "34-map-trip",
    path: "/map",
    act: async (p) => {
      await p.getByRole("button", { name: "Trip" }).click();
      await p.waitForTimeout(900);
    },
  },
  {
    name: "35-settings-connectors",
    path: "/settings",
    act: async (p) => {
      await p.getByRole("switch").click();
      await p.getByText("Connector link", { exact: true }).scrollIntoViewIfNeeded();
      await p.waitForTimeout(200);
    },
  },
  {
    name: "28-ask-thread",
    path: "/ask",
    act: async (p) => {
      await p.getByRole("button", { name: "Who are my investors?" }).click();
      await p.waitForTimeout(1300);
      await p.getByRole("button", { name: "Who do I know in Dubai?" }).click();
      await p.waitForTimeout(1300);
    },
  },
  {
    name: "25-ask-answer",
    path: "/ask",
    act: async (p) => {
      await p.getByRole("button", { name: "Who do I know in Bangkok?" }).click();
      await p.waitForTimeout(1300);
    },
  },
  { name: "36-install-prompt-iphone", path: "/capture", isolated: { userAgent: IPHONE } },
  {
    name: "37-install-steps-iphone",
    path: "/capture",
    isolated: { userAgent: IPHONE },
    act: async (p) => {
      await p.getByRole("button", { name: "How" }).click();
      await p.waitForTimeout(200);
    },
  },
  {
    name: "38-capture-waiting-to-send",
    path: "/capture",
    isolated: { offline: true },
    act: async (p) => {
      await p.getByRole("button", { name: "Start recording" }).click();
      await p.waitForTimeout(1200);
      await p.getByRole("button", { name: "Stop recording" }).click();
      await p.getByText("1 note waiting to send").waitFor();
    },
  },
  { name: "39-offline-page", path: "/offline" },
  {
    name: "40-event-start",
    path: "/capture",
    isolated: {},
    act: async (p) => {
      await p.getByRole("button", { name: "Event mode" }).click();
      await p.getByLabel("Name this event").fill("Gallery night");
      await p.waitForTimeout(400); // the sheet slides up over 280 ms
    },
  },
  {
    name: "41-event-live",
    path: "/capture",
    isolated: {},
    act: async (p) => {
      await p.getByRole("button", { name: "Event mode" }).click();
      await p.getByLabel("Name this event").fill("Gallery night");
      await p.getByRole("button", { name: "Start event mode" }).click();
      for (let i = 0; i < 2; i++) {
        await p.getByRole("button", { name: "Start recording" }).click();
        await p.waitForTimeout(1200);
        await p.getByRole("button", { name: "Stop recording" }).click();
        await p.getByText(`Take ${i + 1} saved`).waitFor();
      }
      await p.waitForTimeout(400);
    },
  },
  {
    name: "42-event-takes",
    path: "/capture",
    isolated: {},
    act: async (p) => {
      await p.getByRole("button", { name: "Event mode" }).click();
      await p.getByLabel("Name this event").fill("Gallery night");
      await p.getByRole("button", { name: "Start event mode" }).click();
      for (let i = 0; i < 3; i++) {
        await p.getByRole("button", { name: "Start recording" }).click();
        await p.waitForTimeout(1200);
        await p.getByRole("button", { name: "Stop recording" }).click();
        await p.getByText(`Take ${i + 1} saved`).waitFor();
      }
      await p.getByRole("button", { name: "End", exact: true }).click();
      await p.waitForURL("**/capture/event");
      await p.waitForTimeout(3500);
    },
  },
  { name: "43-sign-in", path: "/login" },
  {
    name: "44-sign-up-errors-full",
    path: "/signup?code=K7QM-4XRT-9PWD",
    fullPage: true,
    act: async (p) => {
      await p.getByLabel("Your name").fill("Sarah Kim");
      await p.getByLabel("Username").fill("sarah.k");
      await p.getByLabel("Email").fill("sarah@example");
      await p.getByRole("button", { name: "Create account" }).click();
      await p.getByText("Enter a valid email address.").waitFor();
    },
  },
  { name: "45-forgot-password", path: "/forgot-password" },
  { name: "46-review-transcription-failed", path: "/capture/review?state=transcription-failed" },
  { name: "47-review-extraction-failed-full", path: "/capture/review?state=extraction-failed", fullPage: true },
  { name: "48-people-empty", path: "/people?state=empty" },
  { name: "49-ask-empty", path: "/ask?state=empty" },
];

const DARK = new Set([
  "01-capture",
  "02-capture-recording",
  "04-review",
  "07-people",
  "09-profile-full",
  "13-map-cities",
  "14-map-city",
  "19-card-result-qr",
  "25-ask-answer",
  "37-install-steps-iphone",
]);

await mkdir(OUT, { recursive: true });
// A simulated microphone, so recording shots show a real recording.
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

async function newContext(scheme: "light" | "dark", userAgent?: string) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
    // A simulated microphone and a fixed position at Dubai Marina, to match the sample data.
    permissions: ["microphone", "geolocation"],
    geolocation: { latitude: 25.0805, longitude: 55.1403, accuracy: 12 },
    userAgent,
  });
  // Skip the one-time AI consent sheet except in the shot that shows it.
  await context.addInitScript(() => localStorage.setItem("king-of-names:ai-consent", "yes"));
  return context;
}

for (const scheme of ["light", "dark"] as const) {
  const shared = await newContext(scheme);
  for (const shot of SHOTS) {
    if (scheme === "dark" && !DARK.has(shot.name)) continue;
    const context = shot.isolated ? await newContext(scheme, shot.isolated.userAgent) : shared;
    const page = await context.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
    if (shot.isolated?.offline) await context.setOffline(true);
    await page.waitForTimeout(500);
    await shot.act?.(page);
    const file = `${OUT}/${shot.name}${scheme === "dark" ? "-dark" : ""}.png`;
    await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
    console.log(file);
    await page.close();
    if (context !== shared) await context.close();
  }
  await shared.close();
}

await browser.close();
