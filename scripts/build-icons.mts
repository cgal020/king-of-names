// Renders the app icons: the gold crown on deep green "leather", from the
// theme handoff. No name or letters, so it reads as nothing in particular on a
// lock screen. One icon serves light and dark.
// Re-run after changing the icon: npm run icons
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const LEATHER_LIGHT = "#1f4d3d";
const LEATHER_DARK = "#10221c";
const GOLD_LIGHT = "#e3c891";
const GOLD_DARK = "#b48f4c";

// Drawn on a 512 grid. The crown sits inside the 80% safe circle, so the
// same drawing works full bleed (Apple, maskable) and with rounded corners.
const crown = `
  <path d="M166 312 L178 206 L222 250 L256 182 L290 250 L334 206 L346 312 Z" fill="none" stroke="url(#gold)" stroke-width="16" stroke-linejoin="round"/>
  <path d="M174 340 H338" stroke="url(#gold)" stroke-width="16" stroke-linecap="round"/>`;

const svg = (variant: "rounded" | "full") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="leather" cx="50%" cy="85%" r="80%">
      <stop offset="0" stop-color="${LEATHER_LIGHT}"/>
      <stop offset="1" stop-color="${LEATHER_DARK}"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_LIGHT}"/>
      <stop offset="1" stop-color="${GOLD_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${variant === "rounded" ? 112 : 0}" fill="url(#leather)"/>
  ${crown}
</svg>`;

// The browser-tab icon: just the crown, green on light tabs and gold on dark.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>path { stroke: #1f4d3d } @media (prefers-color-scheme: dark) { path { stroke: #c9a96a } }</style>
  <path d="M6 23 L7.5 10 L12.5 15 L16 8 L19.5 15 L24.5 10 L26 23 Z" fill="none" stroke-width="2.4" stroke-linejoin="round"/>
</svg>
`;

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, variant: "rounded" },
  { file: "public/icons/icon-512.png", size: 512, variant: "rounded" },
  { file: "public/icons/maskable-512.png", size: 512, variant: "full" },
  { file: "app/apple-icon.png", size: 180, variant: "full" },
] as const;

await mkdir("public/icons", { recursive: true });
await writeFile("app/icon.svg", favicon);

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
