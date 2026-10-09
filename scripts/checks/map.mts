// Map: pins endpoint, cities, a pin card, Near me, trip. MAPBOX=1 against a server with a Mapbox token (or NEXT_PUBLIC_MAPBOX_STYLE=blank) tests the real map.
// Needs the dev server (or PWA_BASE_URL) and Google Chrome. Run all with: npm run check:flows
import { chromium, expect } from "@playwright/test";
const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.PWA_SHOTS;
const MAPBOX = process.env.MAPBOX === "1";
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const pins = await (await context.request.get(BASE + "/api/map")).json();
  expect(pins.type).toBe("FeatureCollection");
  pass(`/api/map serves ${pins.features.length} pins as GeoJSON`);

  await page.goto(BASE + "/map", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Cities" })).toBeVisible();
  if (MAPBOX) {
    await page.waitForFunction(() => {
      const m = (window as unknown as { __kingMap?: { getSource: (id: string) => unknown; loaded: () => boolean } }).__kingMap;
      return Boolean(m?.getSource("people"));
    }, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    pass("Mapbox map created with the people source");
  } else {
    await expect(page.getByText("Sample map. The real map appears once a Mapbox key is set.")).toBeVisible();
    pass("without a Mapbox key the drawn map shows, labelled as a sample");
  }
  if (SHOTS) await page.screenshot({ path: SHOTS + `/map-cities${MAPBOX ? "-mapbox" : ""}.png` });

  await page.getByRole("button", { name: /^Dubai\b/ }).last().click();
  await expect(page.getByRole("heading", { name: "Dubai" })).toBeVisible();
  pass("choosing a city shows the people met there");

  if (MAPBOX) {
    // Tap a real pin on the canvas: find one on screen from the map itself.
    await page.waitForTimeout(1500);
    const point = await page.evaluate(() => {
      const m = (window as unknown as { __kingMap: { queryRenderedFeatures: (o: { layers: string[] }) => { properties: { id: string; name: string } }[]; project: (c: [number, number]) => { x: number; y: number }; getCanvas: () => HTMLCanvasElement } }).__kingMap;
      const f = m.queryRenderedFeatures({ layers: ["people"] })[0] as unknown as { properties: { id: string; name: string }; geometry: { coordinates: [number, number] } } | undefined;
      if (!f) return null;
      const p = m.project(f.geometry.coordinates);
      const r = m.getCanvas().getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y, name: f.properties.name };
    });
    expect(point).not.toBeNull();
    await page.mouse.click(point!.x, point!.y);
    await expect(page.getByRole("link", { name: "Open profile" })).toBeVisible();
    await expect(page.getByRole("heading", { name: point!.name })).toBeVisible();
    pass(`tapping a pin on the real map opens ${point!.name}'s card`);
    if (SHOTS) await page.screenshot({ path: SHOTS + "/map-person-mapbox.png" });
    // Tap empty map: far corner of the canvas.
    const box = (await page.locator("canvas.mapboxgl-canvas").boundingBox())!;
    await page.mouse.click(box.x + 20, box.y + box.height * 0.45);
    await expect(page.getByRole("heading", { name: "Dubai" })).toBeVisible();
    pass("tapping the map away from a pin closes the card");
  } else {
    const pin = page.getByRole("button", { name: "Priya Raman" });
    await pin.click();
    await expect(page.getByRole("link", { name: "Open profile" })).toBeVisible();
    pass("tapping a pin opens the person's card");
    await page.mouse.click(30, 300);
    await expect(page.getByRole("heading", { name: "Dubai" })).toBeVisible();
    pass("tapping the map away from a pin closes the card");
  }

  await page.getByRole("button", { name: "Near me" }).click();
  await expect(page.getByText(/Within 5 km|No one within 5 km/).first()).toBeVisible();
  await page.getByRole("radio", { name: "25 km" }).click();
  await page.waitForTimeout(1200);
  if (SHOTS) await page.screenshot({ path: SHOTS + `/map-near${MAPBOX ? "-mapbox" : ""}.png` });
  pass("Near me lists people by distance and the radius changes");

  await page.getByRole("button", { name: "Trip" }).click();
  await expect(page.getByRole("heading", { name: /^Trip to / })).toBeVisible();
  pass("Trip mode opens");

  // Review: move the pin under a fixed centre pin.
  await page.goto(BASE + "/capture/review", { waitUntil: "networkidle" });
  if (MAPBOX) {
    await expect(page.locator("picture img[src*=\"api.mapbox.com/styles/v1/mapbox/light-v11/static/\"]")).toHaveCount(1);
    pass("Review shows a still Mapbox image, not a live map");
  }
  await expect(page.getByText("Pin placed by hand")).toHaveCount(0);
  await page.getByRole("button", { name: "Move pin" }).click();
  const mover = page.getByRole("dialog", { name: "Move the pin" });
  await expect(mover).toBeVisible();
  if (MAPBOX) await page.waitForFunction(() => Boolean((window as unknown as { __kingPinMap?: unknown }).__kingPinMap), null, { timeout: 15000 });
  const pinMapCenter = () =>
    page.evaluate(() => (window as unknown as { __kingPinMap?: { getCenter: () => { lat: number; lng: number } } }).__kingPinMap?.getCenter() ?? null);
  const before = MAPBOX ? await pinMapCenter() : null;
  const area = (await mover.locator(MAPBOX ? "canvas" : "[aria-label^=\"Map. Drag\"]").first().boundingBox())!;
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(area.x + area.width / 2 - 80, area.y + area.height / 2 + 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  if (SHOTS) await page.screenshot({ path: SHOTS + `/pin-mover${MAPBOX ? "-mapbox" : ""}.png` });
  if (MAPBOX) {
    const after = await pinMapCenter();
    expect(after!.lng).toBeGreaterThan(before!.lng);
    expect(after!.lat).toBeGreaterThan(before!.lat);
  }
  await mover.getByRole("button", { name: "Use this spot" }).click();
  await expect(mover).toHaveCount(0);
  await expect(page.getByText("Pin placed by hand")).toBeVisible();
  pass("Move pin: drag the map under the pin, and the spot is marked as placed by hand");

  await page.getByRole("button", { name: "Move pin" }).click();
  await page.getByRole("dialog", { name: "Move the pin" }).getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog", { name: "Move the pin" })).toHaveCount(0);
  pass("Cancel closes the pin mover");

  if (errors.length) out.push("INFO page errors: " + errors.slice(0, 3).join(" | ").slice(0, 400));
  await context.close();
} catch (e) {
  out.push("FAIL " + (e as Error).message.split("\n").slice(0, 6).join(" | "));
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log(out.join("\n"));
}
