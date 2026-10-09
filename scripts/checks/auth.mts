// Sign-in screens in preview mode: errors, show password, ?next=, sign-up, reset, sign out, delete account.
// Needs the dev server (or PWA_BASE_URL) and Google Chrome. Run all with: npm run check:flows
import { chromium, expect } from "@playwright/test";
const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.PWA_SHOTS;
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);
const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Sign in
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Remember everyone you meet." })).toBeVisible();
  await expect(page.getByText(/Preview: accounts aren’t connected yet/)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: SHOTS + "/auth-login.png" });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter your username or email.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  await page.getByLabel("Username or email").fill("cameron");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle"); // let the submission finish, as a person would
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await expect(page.getByLabel("Username or email")).toHaveValue("cameron");
  await expect(page.getByText("Enter your password.")).toBeVisible();
  pass("sign-in explains missing fields and keeps what was typed");

  const pw = page.getByLabel("Password", { exact: true });
  await pw.fill("secret pass");
  await expect(pw).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(pw).toHaveAttribute("type", "text");
  pass("the password can be shown and hidden");

  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  pass("preview sign-in opens the app");

  await page.goto(BASE + "/login?next=%2Fpeople", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill("cameron");
  await page.getByLabel("Password", { exact: true }).fill("secret pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/people", { waitUntil: "commit" });
  await page.goto(BASE + "/login?next=https%3A%2F%2Fevil.example", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill("cameron");
  await page.getByLabel("Password", { exact: true }).fill("secret pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  pass("returns to the page you were going to, but never to another site");

  // Sign up
  await page.goto(BASE + "/signup?code=k7qm-4xrt-9pwd", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Invite code")).toHaveValue("k7qm-4xrt-9pwd");
  await page.getByLabel("Your name").fill("Sarah Kim");
  await page.getByLabel("Username").fill("sarah.k");
  await page.getByLabel("Email").fill("sarah@example");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use 3 to 24 lowercase letters, numbers or _.")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Sarah Kim");
  await expect(page.getByLabel("Invite code")).toHaveValue("k7qm-4xrt-9pwd");
  if (SHOTS) await page.screenshot({ path: SHOTS + "/auth-signup-errors.png", fullPage: true });
  pass("sign-up explains each problem and keeps the rest of the form");

  await page.getByLabel("Username").fill("Sarah_K");
  await page.getByLabel("Email").fill(" sarah@example.com ");
  await page.getByLabel("Password", { exact: true }).fill("a long enough password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  pass("a valid sign-up opens the app (an invite link fills the code)");

  // Password reset
  await page.goto(BASE + "/forgot-password?expired=1", { waitUntil: "networkidle" });
  await expect(page.getByText("That reset link has expired or was already used.")).toBeVisible();
  await page.getByLabel("Username or email").fill("cameron");
  await page.getByRole("button", { name: "Email me a reset link" }).click();
  await expect(page.getByText(/If there’s an account for that, we’ve emailed a link/)).toBeVisible();
  pass("reset requests get the same answer whether or not the account exists");

  await page.goto(BASE + "/reset-password", { waitUntil: "networkidle" });
  await page.getByLabel("New password").fill("new long password");
  await page.getByLabel("Type it again").fill("new long passw0rd");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("The passwords don’t match.")).toBeVisible();
  await page.getByLabel("New password").fill("new long password");
  await page.getByLabel("Type it again").fill("new long password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  pass("choosing a new password checks both match");

  // Sign out clears the phone
  await page.evaluate(() => {
    localStorage.setItem("king-of-names:ai-consent", "yes");
    localStorage.setItem("king-of-names:event", JSON.stringify({ id: "e", name: "x", startedAt: new Date().toISOString(), endedAt: null, takes: [] }));
  });
  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { waitUntil: "commit" });
  const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("king-of-names:")));
  expect(left).toEqual([]);
  pass("signing out clears what the app kept on this phone and goes to sign in");

  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete everything" }).click();
  await expect(page.getByText("Preview only. Nothing was removed.")).toBeVisible();
  pass("delete account asks first (preview removes nothing)");

  await context.close();
} catch (e) {
  out.push("FAIL " + (e as Error).message.split("\n").slice(0, 6).join(" | "));
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log(out.join("\n"));
}
