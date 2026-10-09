// End-to-end check against the real Supabase project: a throwaway account
// signs in, adds, edits, searches, exports and deletes a person, makes an
// invite code, and is deleted again at the end. Nobody else's data is read.
// Needs the dev server running with .env.local and Google Chrome.
// Run with: npm run check:real
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

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
  const { data: row } = await admin.from("people").select("user_id, city, lat, met_timezone").eq("id", personId).single();
  expect(row?.user_id).toBe(userId);
  expect(row?.city).toBe("Dubai");
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

  await page.goto(BASE + "/people", { waitUntil: "networkidle" });
  await page.getByLabel("Search people").fill("flamingo");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  pass("search finds them by a word only in their notes");

  const pins = await (await page.request.get(BASE + "/api/map")).json();
  expect(pins.features).toHaveLength(1);
  expect(Object.keys(pins.features[0].properties).sort()).toEqual(["city", "id", "initials", "met_at", "name"]);
  pass("the map gets one pin for them, without their notes");

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
  await expect(page.getByText("No one here yet")).toBeVisible();
  const { count: left } = await admin.from("people").select("id", { count: "exact", head: true }).eq("user_id", userId);
  expect(left).toBe(0);
  pass("deleting removes them from the database");
} catch (error) {
  out.push("FAIL " + String((error as Error).message).split("\n").slice(0, 3).join(" | "));
} finally {
  await browser.close();
  await admin.from("invite_codes").delete().eq("created_by", userId);
  await admin.auth.admin.deleteUser(userId);
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", userId);
  out.push(count === 0 ? "PASS the test account was removed" : "FAIL the test account is still there");
}
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exitCode = 1;
