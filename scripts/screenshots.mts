// Captures every screen and key state at phone size, light and dark, for
// design reviews. Needs the dev server running and Google Chrome installed.
// Run with: npm run screenshots
import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT = "docs/design-handoff/screens";

type Shot = { name: string; path: string; fullPage?: boolean; act?: (page: Page) => Promise<void> };

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
];

const DARK = new Set(["01-capture", "02-capture-recording", "04-review", "07-people", "09-profile-full", "13-map-cities", "14-map-city"]);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

for (const scheme of ["light", "dark"] as const) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
  });
  for (const shot of SHOTS) {
    if (scheme === "dark" && !DARK.has(shot.name)) continue;
    const page = await context.newPage();
    await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot.act?.(page);
    const file = `${OUT}/${shot.name}${scheme === "dark" ? "-dark" : ""}.png`;
    await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
    console.log(file);
    await page.close();
  }
  await context.close();
}

await browser.close();
