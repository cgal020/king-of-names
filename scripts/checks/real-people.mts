// End-to-end check against the real Supabase project: a throwaway account
// signs in, adds, edits, searches, exports and deletes a person, makes an
// invite code, and is deleted again at the end. Nobody else's data is read.
// Needs the dev server running with .env.local and Google Chrome.
// Run with: npm run check:real
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);

const suffix = randomBytes(4).toString("hex");
const username = `smoke_${suffix}`;
const email = `smoke-${suffix}@example.com`;
const password = randomBytes(18).toString("base64url");
const name = `Smoke Test ${suffix}`;

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username, display_name: "Smoke Test" },
});
if (createError || !created.user) throw new Error(`Could not create the test account: ${createError?.message}`);
const userId = created.user.id;

const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 25.0805, longitude: 55.1403, accuracy: 12 },
    permissions: ["geolocation", "clipboard-read", "clipboard-write"],
    acceptDownloads: true,
  });
  const page = await context.newPage();

  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  await expect(page.getByText("Preview with sample data")).toHaveCount(0);
  pass("a real account signs in, with no sample-data banner");

  await page.goto(BASE + "/people", { waitUntil: "networkidle" });
  await expect(page.getByText("No one here yet")).toBeVisible();
  pass("a new account starts with no people");

  await page.goto(BASE + "/people/new", { waitUntil: "networkidle" });
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Notes").fill("Breeds pink flamingos near the Marina.");
  // The phone's location fills in after the form opens.
  await expect(page.getByText(/Dubai/).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/, { waitUntil: "commit" });
  const personId = page.url().split("/").pop()!;
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText(/Dubai/).first()).toBeVisible();
  const { data: row } = await admin.from("people").select("user_id, city, place_name, lat, met_timezone").eq("id", personId).single();
  expect(row?.user_id).toBe(userId);
  expect(row?.city).toBe("Dubai");
  // The name people use, not Mapbox's official "Marsa Dubai".
  expect(row?.place_name).not.toBe("Marsa Dubai");
  expect(row?.lat).toBeCloseTo(25.08, 2);
  expect(row?.met_timezone).toBeTruthy();
  pass("adding someone saves them to the database, owned by this account, with the place looked up");

  await page.getByRole("link", { name: "Edit" }).click();
  await page.waitForURL(`**/people/${personId}/edit`, { waitUntil: "commit" });
  await page.getByLabel("Notes").fill("Breeds pink flamingos near the Marina. Wants a Bangkok intro.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(`**/people/${personId}`, { waitUntil: "commit" });
  await expect(page.getByText("Wants a Bangkok intro.")).toBeVisible();
  pass("editing saves the change");

  // A sample business card rendered to a PNG, for the photo and card tests.
  const shot = await context.newPage();
  await shot.setViewportSize({ width: 1200, height: 900 });
  await shot.goto(BASE + "/mock/photos/card-kenji.svg");
  const cardPng = await shot.screenshot();
  await shot.close();

  await page.getByRole("button", { name: "Add photo" }).click();
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Place" }).click()]);
  await chooser.setFiles({ name: "place.png", mimeType: "image/png", buffer: cardPng });
  await expect(page.getByText("Photo added")).toBeVisible();
  await expect
    .poll(async () => (await admin.from("photos").select("id").eq("person_id", personId)).data?.length, { timeout: 20_000 })
    .toBe(1);
  const { data: photo } = await admin.from("photos").select("kind, place_label, storage_path").eq("person_id", personId).single();
  expect(photo?.kind).toBe("moment");
  expect(photo?.place_label).toContain("Dubai");
  expect(photo?.storage_path.startsWith(`${userId}/`)).toBe(true);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator('img[src*="/storage/v1/object/sign/photos/"]').first()).toBeVisible();
  pass("a photo uploads to the account's private photos with its place, and is still there after a reload");

  await page.goto(BASE + "/people", { waitUntil: "networkidle" });
  await page.getByLabel("Search people").fill("flamingo");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  pass("search finds them by a word only in their notes");

  // From Cameron's audit: company, role and phone numbers weren't searched.
  await admin.from("people").update({ phone: "+971505550199", extras: { company: "Pinkwater Trading", role: "COO" } }).eq("id", personId);
  await page.reload({ waitUntil: "networkidle" });
  for (const query of ["Pinkwater", "coo", "050 555 0199"]) {
    await page.getByLabel("Search people").fill(query);
    await expect(page.getByRole("link", { name: new RegExp(name) }), query).toBeVisible();
  }
  await page.getByLabel("Search people").fill("Pinkwater Manila");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
  pass("search also finds them by company, role and phone number");

  await page.goto(BASE + "/ask", { waitUntil: "networkidle" });
  await page.getByLabel("Your question").fill("Who breeds flamingos?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  // The first question asks before sending anything to the AI.
  await expect(page.getByRole("dialog", { name: "Before your first question" })).toBeVisible();
  await page.getByRole("button", { name: "I agree" }).click();
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible({ timeout: 30_000 });
  pass("Ask AI answers from their saved people and links the person it used");
  await expect
    .poll(async () => ((await admin.auth.admin.getUserById(userId)).data.user?.user_metadata as { ai_consent_at?: string }).ai_consent_at ?? null)
    .not.toBeNull();
  pass("agreeing to the AI is kept on the account, so other phones don't ask again");

  const pins = await (await page.request.get(BASE + "/api/map")).json();
  expect(pins.features).toHaveLength(1); // before the card test adds a second person
  expect(Object.keys(pins.features[0].properties).sort()).toEqual(["city", "id", "initials", "met_at", "name"]);
  pass("the map gets one pin for them, without their notes");

  await page.goto(BASE + "/capture/card", { waitUntil: "networkidle" });
  await expect(page.getByRole("dialog", { name: /^Before your first/ })).toHaveCount(0);
  const [cardChooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Library" }).click()]);
  await cardChooser.setFiles({ name: "card.png", mimeType: "image/png", buffer: cardPng });
  await expect(page.getByText("Read from the card")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Kenji Watanabe")).toBeVisible();
  await page.getByRole("button", { name: "Add this person" }).click();
  await page.waitForURL("**/people/new", { waitUntil: "commit" });
  // The label reads "Name From card".
  await expect(page.locator("#full_name")).toHaveValue("Kenji Watanabe");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/, { waitUntil: "commit" });
  const kenjiId = page.url().split("/").pop()!;
  await expect
    .poll(async () => (await admin.from("photos").select("kind").eq("person_id", kenjiId)).data?.map((p) => p.kind), { timeout: 20_000 })
    .toEqual(["card"]);
  pass("a photographed card is read by the AI, fills in Add someone, and the card photo is saved with them");

  // A photo of a card with a QR code on it: both are read and combined.
  const withQr = async (text: string, card: boolean) => {
    const qr = await QRCode.toString(text, { type: "svg", margin: 2, width: 300 });
    const shot = await context.newPage();
    await shot.setViewportSize({ width: 1200, height: card ? 1250 : 500 });
    await shot.setContent(
      `<body style="margin:0;background:#ddd">${card ? `<img src="${BASE}/mock/photos/card-kenji.svg" width="1200" height="900" style="display:block">` : ""}` +
        `<div style="width:300px;margin:20px auto;background:#fff">${qr}</div></body>`,
      { waitUntil: "networkidle" },
    );
    const png = await shot.screenshot({ fullPage: true });
    await shot.close();
    await page.goto(BASE + "/capture/card", { waitUntil: "networkidle" });
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Library" }).click()]);
    await chooser.setFiles({ name: "card.png", mimeType: "image/png", buffer: png });
  };
  await withQr("https://andamanblue.example/charters", true);
  await expect(page.getByText("Read from the QR code and the card")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Kenji Watanabe")).toBeVisible();
  await expect(page.getByText("https://andamanblue.example/charters")).toBeVisible();
  pass("a card with a QR code on it gives both: the printed details and the QR's link");

  // A LinkedIn QR alone: the page can't be read, but the address gives a name to check.
  await withQr("https://www.linkedin.com/in/priya-raman-5c2d9e1f?utm_source=share", false);
  await expect(page.getByText("Read from the QR code", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Guessed from their LinkedIn address/)).toBeVisible();
  await page.getByRole("button", { name: "Add this person" }).click();
  await page.waitForURL("**/people/new", { waitUntil: "commit" });
  await expect(page.locator("#full_name")).toHaveValue("Priya Raman");
  await expect(page.getByText("Check the name. It was guessed from their LinkedIn address.")).toBeVisible();
  pass("a LinkedIn QR fills in the name from its address and asks to check it");

  // The link reader opens only digital cards and contact files, on public addresses.
  const readLink = (link: string) => page.request.post(BASE + "/api/cards/link", { data: { url: link } });
  for (const link of ["http://localtest.me/card.vcf", "https://andamanblue.example/charters", "http://169.254.169.254/latest/card.vcf"]) {
    const response = await readLink(link);
    expect(response.status()).toBe(200);
    expect((await response.json()).details).toBeNull();
  }
  const outsider = await browser.newContext();
  expect((await outsider.request.post(BASE + "/api/cards/link", { data: { url: "https://blinq.me/x" } })).status()).toBe(401);
  await outsider.close();
  pass("the link reader refuses other sites, this machine and signed-out callers");

  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  const aiSwitch = page.getByRole("switch", { name: "Use AI to fill in profiles" });
  await expect(aiSwitch).toHaveAttribute("aria-checked", "true");
  await aiSwitch.click();
  await expect(aiSwitch).toHaveAttribute("aria-checked", "false");
  await expect
    .poll(async () => ((await admin.auth.admin.getUserById(userId)).data.user?.user_metadata as { ai_consent_at?: string | null }).ai_consent_at ?? null)
    .toBeNull();
  await page.goto(BASE + "/capture/card", { waitUntil: "networkidle" });
  await expect(page.getByRole("dialog", { name: "Before your first card" })).toBeVisible();
  pass("turning the AI off in Settings is kept, and the next card asks first");

  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  await expect(page.getByText(username)).toBeVisible();
  await page.getByRole("button", { name: "New invite code" }).click();
  await expect(page.getByText(/Invite link copied|Copy didn't work/)).toBeVisible();
  const { count: invites } = await admin.from("invite_codes").select("code", { count: "exact", head: true }).eq("created_by", userId);
  expect(invites).toBe(1);
  pass("Settings shows the real account and makes a real invite code");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export JSON" }).click()]);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(JSON.stringify(exported)).toContain(name);
  pass("export contains their saved people");

  await page.goto(BASE + `/people/${personId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Delete Smoke/ }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL("**/people", { waitUntil: "commit" });
  await expect(page.getByText("Kenji Watanabe")).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);
  const { data: left } = await admin.from("people").select("id").eq("user_id", userId);
  expect(left?.map((p) => p.id)).toEqual([kenjiId]);
  const { data: photoFiles } = await admin.storage.from("photos").list(userId);
  expect(photoFiles).toHaveLength(1);
  pass("deleting removes them and their photos from the database and storage");
} catch (error) {
  out.push("FAIL " + String((error as Error).message).split("\n").slice(0, 3).join(" | "));
} finally {
  await browser.close();
  for (const bucket of ["photos", "audio"]) {
    const { data: files } = await admin.storage.from(bucket).list(userId);
    if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
  }
  await admin.from("invite_codes").delete().eq("created_by", userId);
  await admin.auth.admin.deleteUser(userId);
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", userId);
  out.push(count === 0 ? "PASS the test account was removed" : "FAIL the test account is still there");
}
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exitCode = 1;
