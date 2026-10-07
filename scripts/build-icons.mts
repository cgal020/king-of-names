// Renders the app icons from one SVG, in the accent colour from lib/config.ts.
// Re-run after changing the accent: npm run icons
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { appConfig } from "../lib/config.ts";

const accent = appConfig.accent.light;
const paper = appConfig.background.light;

// A map pin with a dot: where you met someone.
const glyph = `
  <path d="M50 18c-14.4 0-26 11.3-26 25.6C24 62 50 82 50 82s26-20 26-38.4C76 29.3 64.4 18 50 18z" fill="${paper}"/>
  <circle cx="50" cy="44" r="10" fill="${accent}"/>`;

// Rounded for "any" use; full-bleed with a smaller glyph for maskable and
// Apple icons, which the OS crops itself.
const svg = (variant: "rounded" | "full") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${variant === "rounded" ? 22 : 0}" fill="${accent}"/>
  ${variant === "full" ? `<g transform="translate(50 50) scale(0.74) translate(-50 -50)">${glyph}</g>` : glyph}
</svg>`;

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, variant: "rounded" },
  { file: "public/icons/icon-512.png", size: 512, variant: "rounded" },
  { file: "public/icons/maskable-512.png", size: 512, variant: "full" },
  { file: "app/apple-icon.png", size: 180, variant: "full" },
] as const;

await mkdir("public/icons", { recursive: true });
await writeFile("app/icon.svg", svg("rounded").trim() + "\n");

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
for (const { file, size, variant } of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(variant).replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: file, omitBackground: variant === "rounded", clip: { x: 0, y: 0, width: size, height: size } });
  console.log(file);
}
await browser.close();
