// End-to-end check of QR codes against the real Supabase project: a throwaway
// account makes a WhatsApp code, the drawn code is decoded with Chrome's own
// barcode reader, a signed-out visitor scans it, the destination is changed
// without changing the code, a contact card code opens its page and vCard,
// and deleting a code stops it working. Needs the dev server and Chrome.
// Run with: npm run check:qr
import { randomBytes } from "node:crypto";
import { chromium, expect, type Page } from "@playwright/test";
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
const password = randomBytes(18).toString("base64url");
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email: `smoke-${suffix}@example.com`,
  password,
  email_confirm: true,
  user_metadata: { username, display_name: "Qr Test" },
});
if (createError || !created.user) throw new Error(`Could not create the test account: ${createError?.message}`);
const userId = created.user.id;

// Reads the QR drawn on the page with Chrome's BarcodeDetector.
async function decodeQr(page: Page) {
  return page.evaluate(async () => {
    const svg = document.querySelector('svg[aria-label^="QR code"]')!;
    const data = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    const img = new Image();
    img.src = data;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 600;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, 600, 600);
    ctx.drawImage(img, 0, 0, 600, 600);
    const detector = new (window as unknown as { BarcodeDetector: new (o: object) => { detect: (c: HTMLCanvasElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ["qr_code"] });
    const found = await detector.detect(canvas);
    return found[0]?.rawValue ?? null;
  });
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });

  await page.getByRole("link", { name: "My QR codes" }).click();
  await page.waitForURL("**/qr", { waitUntil: "commit" });
  await expect(page.getByRole("heading", { name: "No QR codes yet" })).toBeVisible();
  await page.getByRole("link", { name: "Make a QR code" }).click();
  await page.getByRole("button", { name: "WhatsApp" }).click();
  await expect(page.getByLabel("Words under the code")).toHaveValue("WhatsApp me");
  await page.getByLabel("Your WhatsApp number").fill("+971 55 555 0199");
  await page.getByRole("button", { name: "Make the code" }).click();
  await page.waitForURL("**/qr", { waitUntil: "commit" });
  await expect(page.getByRole("heading", { name: "WhatsApp me" })).toBeVisible();
  const { data: codes } = await admin.from("qr_codes").select("id, slug, user_id, destination").eq("user_id", userId);
  expect(codes).toHaveLength(1);
  const { id, slug } = codes![0];
  expect(codes![0].destination).toEqual({ purpose: "whatsapp", phone: "971555550199" });
  pass("a WhatsApp code is made from Capture's QR button and saved to the account");

  expect(await decodeQr(page)).toBe(`${BASE}/q/${slug}`);
  pass("the designed code, crown and all, scans as the code's own address");

  const visitor = await browser.newContext();
  const scan = async () => visitor.request.get(`${BASE}/q/${slug}`, { maxRedirects: 0 });
  let response = await scan();
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("https://wa.me/971555550199");
  const { data: counted } = await admin.from("qr_codes").select("scan_count, last_scanned_at").eq("id", id).single();
  expect(counted?.scan_count).toBe(1);
  expect(counted?.last_scanned_at).toBeTruthy();
  pass("a signed-out visitor who scans it goes to WhatsApp, and the scan is counted");

  await page.goto(`${BASE}/settings/qr/${id}`, { waitUntil: "networkidle" });
  await expect(page.getByText(/Scanned once/)).toBeVisible();
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByLabel("Words under the code")).toHaveValue("Visit my website");
  await page.getByLabel("Web address").fill("example.com/menu");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL("**/qr", { waitUntil: "commit" });
  response = await scan();
  expect(response.headers().location).toBe("https://example.com/menu");
  pass("changing where it goes (typed without https://) keeps the same code and sends the next scan there");

  await page.goto(`${BASE}/settings/qr/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Qr Test Person");
  await page.getByLabel("Company").fill("Smoke & Mirrors");
  await page.getByLabel("Phone").fill("+971 55 555 0100");
  await page.getByRole("button", { name: "Make the code" }).click();
  await page.waitForURL("**/qr", { waitUntil: "commit" });
  const { data: contact } = await admin.from("qr_codes").select("slug").eq("user_id", userId).eq("label", "Save my contact").single();
  const card = await visitor.newPage();
  await card.goto(`${BASE}/q/${contact!.slug}`, { waitUntil: "networkidle" });
  await expect(card.getByRole("heading", { name: "Qr Test Person" })).toBeVisible();
  await expect(card.getByRole("link", { name: "Save contact" })).toBeVisible();
  const vcf = await visitor.request.get(`${BASE}/q/${contact!.slug}/contact.vcf`);
  expect(vcf.headers()["content-type"]).toContain("text/vcard");
  const text = await vcf.text();
  expect(text).toContain("FN:Qr Test Person");
  expect(text).toContain("ORG:Smoke & Mirrors");
  pass("a contact code opens a page with the details, and Save contact gives a vCard");

  await page.goto(`${BASE}/settings/qr/${id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Delete this code" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL((u) => u.pathname === "/settings", { waitUntil: "commit" });
  response = await scan();
  expect(response.status()).toBe(404);
  pass("a deleted code stops working");
} catch (error) {
  out.push("FAIL " + String((error as Error).message).split("\n").slice(0, 6).join(" | "));
} finally {
  await browser.close();
  await admin.auth.admin.deleteUser(userId);
  const { count } = await admin.from("qr_codes").select("id", { count: "exact", head: true }).eq("user_id", userId);
  out.push(count === 0 ? "PASS the test account and its codes were removed" : "FAIL the test account's codes are still there");
}
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exitCode = 1;
