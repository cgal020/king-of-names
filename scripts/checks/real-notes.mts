// End-to-end check of voice notes against the real Supabase project, with a
// fake microphone: a throwaway account records a note, it is uploaded and
// processed, reviewed and saved as a person, gets a typed "Met again" note,
// and a second note is discarded. Everything is deleted again at the end.
// Without an OpenAI key the note can't be transcribed, which exercises the
// "type it in" path instead. Needs the dev server with .env.local and Chrome.
// Run with: npm run check:notes
import { randomBytes } from "node:crypto";
import { chromium, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.PWA_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
const transcribes = Boolean(process.env.OPENAI_API_KEY);

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const out: string[] = [];
const pass = (m: string) => out.push("PASS " + m);

const suffix = randomBytes(4).toString("hex");
const username = `smoke_${suffix}`;
const password = randomBytes(18).toString("base64url");
const name = `Note Test ${suffix}`;
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email: `smoke-${suffix}@example.com`,
  password,
  email_confirm: true,
  // Agreed at sign-up, as the sign-up form allows, so recording isn't interrupted.
  user_metadata: { username, display_name: "Note Test", ai_consent_at: new Date().toISOString() },
});
if (createError || !created.user) throw new Error(`Could not create the test account: ${createError?.message}`);
const userId = created.user.id;

let steps = false;
async function record(page: Page, { watchSteps = false } = {}) {
  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Stop recording" }).click();
  if (watchSteps) {
    // The steps follow the server: with no key, transcription shows as failed.
    const outcome = transcribes ? "Picking out the details, done" : "Couldn’t transcribe it; you can type the details";
    await page.getByText(outcome).waitFor({ state: "attached", timeout: 30_000 });
    steps = true;
  }
  await page.waitForURL(/\/capture\/review\?capture=[0-9a-f-]{36}$/, { timeout: 60_000, waitUntil: "commit" });
  return new URL(page.url()).searchParams.get("capture")!;
}

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 13.7246, longitude: 100.5296, accuracy: 15 },
    permissions: ["microphone", "geolocation"],
  });
  await context.addInitScript(() => {
    localStorage.setItem("king-of-names:install-coach-dismissed", "yes");
  });
  const page = await context.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });

  const noteId = await record(page, { watchSteps: true });
  const { data: stored } = await admin.from("captures").select("user_id, status, audio_path, lat, geocode, transcript").eq("id", noteId).single();
  expect(stored?.user_id).toBe(userId);
  expect(stored?.audio_path).toBe(`${userId}/${noteId}.webm`);
  expect(stored?.lat).toBeCloseTo(13.72, 1);
  const { data: files } = await admin.storage.from("audio").list(userId);
  expect(files?.map((f) => f.name)).toContain(`${noteId}.webm`);
  pass("a recording is uploaded to the account's own audio folder with its place");
  expect(steps).toBe(true);
  pass("Capture's steps follow the server's real progress before Review opens");

  await expect(page.locator("audio")).toHaveCount(1);
  if (transcribes) {
    expect(stored?.status).toBe("extracted");
    pass("the note is transcribed and the details picked out");
  } else {
    expect(stored?.status).toBe("failed");
    await expect(page.getByText("We couldn’t turn this recording into text")).toBeVisible();
    pass("with no transcription key, Review says so and keeps the recording to play");
  }
  expect((stored?.geocode as { city?: string } | null)?.city).toBe("Bangkok");
  pass("the place is looked up from where the note was recorded");

  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/, { waitUntil: "commit" });
  const personId = page.url().split("/").pop()!;
  await expect(page.getByRole("heading", { name })).toBeVisible();
  const { data: saved } = await admin.from("captures").select("person_id, status, first_meeting").eq("id", noteId).single();
  expect(saved).toEqual({ person_id: personId, status: "confirmed", first_meeting: true });
  const { data: person } = await admin.from("people").select("city").eq("id", personId).single();
  expect(person?.city).toBe("Bangkok");
  pass("saving the review creates the person and links the note as how you first met");

  await expect(page.getByText("Met once")).toBeVisible();
  await page.getByRole("button", { name: "Met again" }).click();
  await page.getByLabel("Note about this meeting").fill("Coffee again; wants the Melbourne intro.");
  await page.getByRole("button", { name: "Add meeting" }).click();
  await expect(page.getByText("Met 2 times")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Coffee again; wants the Melbourne intro.")).toBeVisible();
  pass("a typed Met again note is saved as a second meeting");

  // A note naming other people, as the AI leaves it once a note is read.
  const { data: told, error: toldError } = await admin
    .from("captures")
    .insert({
      user_id: userId,
      status: "extracted",
      recorded_at: new Date().toISOString(),
      recorded_timezone: "Asia/Bangkok",
      transcript: `Met Daniel Reyes at the Soho House rooftop with his partner Rosa Reyes. ${name} was there too.`,
      extraction: {
        full_name: "Daniel Reyes",
        where_met_text: "Soho House rooftop",
        phone: null,
        birthday: { month: null, day: null, year: null },
        notes: "Came with his partner Rosa.",
        follow_up: { note: null, date: null },
        extras: { email: null, company: null, role: null, website: null, linkedin: null },
        other_details: [],
        additional_people: ["Rosa Reyes", name],
        relationship: null,
        suggested_tags: [],
        confidence: { full_name: "high" },
      },
    })
    .select("id")
    .single();
  if (toldError) throw toldError;
  await page.goto(BASE + `/capture/review?capture=${told.id}`, { waitUntil: "networkidle" });
  await expect(page.getByText("Also in this note")).toBeVisible();
  // Someone already saved is linked, not offered again.
  await expect(page.getByRole("link", { name: new RegExp(`${name}.*Already in your people`) })).toBeVisible();
  await page.getByRole("button", { name: /Also save\s*Rosa Reyes/ }).click();
  await expect(page.getByRole("button", { name: /Will be saved too\s*Rosa Reyes/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/, { waitUntil: "commit" });
  await expect(page.getByText("Also saved Rosa Reyes.")).toBeVisible();
  const { data: rosa } = await admin.from("people").select("notes, where_met_text, phone, met_at").eq("user_id", userId).eq("full_name", "Rosa Reyes");
  expect(rosa).toHaveLength(1);
  expect(rosa![0]).toMatchObject({ notes: "Mentioned in your note about Daniel Reyes.", where_met_text: "Soho House rooftop", phone: null });
  const { count: namesakes } = await admin.from("people").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("full_name", name);
  expect(namesakes).toBe(1);
  pass("others named in a note can be saved too, met at the same time and place, without duplicating anyone");
  // Tidy up, so the later steps count only their own notes and people.
  await admin.from("captures").delete().eq("id", told.id);
  await admin.from("people").delete().eq("user_id", userId).in("full_name", ["Daniel Reyes", "Rosa Reyes"]);
  // Back to the first person for the steps below.
  await page.goto(BASE + `/people/${personId}`, { waitUntil: "networkidle" });

  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await expect(page.getByText("to review")).toHaveCount(0);
  const discardId = await record(page);
  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await expect(page.getByText("1 note to review")).toBeVisible();
  pass("an undecided note waits on Capture's review strip");

  await page.goto(BASE + `/capture/review?capture=${discardId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Discard" }).click();
  await page.getByRole("button", { name: "Discard", exact: true }).last().click();
  await page.waitForURL("**/capture", { waitUntil: "commit" });
  const { count: kept } = await admin.from("captures").select("id", { count: "exact", head: true }).eq("id", discardId);
  expect(kept).toBe(0);
  const { data: after } = await admin.storage.from("audio").list(userId);
  expect(after?.map((f) => f.name)).not.toContain(`${discardId}.webm`);
  pass("discarding deletes the note and its recording");

  await page.goto(BASE + "/capture", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Event mode" }).click();
  await page.getByRole("dialog").getByLabel("Name this event").fill("Test night");
  await page.getByRole("dialog").getByRole("button", { name: "Start event mode" }).click();
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByText("Take 1 saved")).toBeVisible();
  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.waitForURL("**/capture/event", { waitUntil: "commit" });
  await expect(page.getByText(/^Ready to review/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(transcribes ? /./ : "Name not caught")).toBeVisible();
  const { data: takes } = await admin.from("captures").select("id, status").eq("user_id", userId).is("person_id", null);
  expect(takes).toHaveLength(1);
  expect(takes?.[0].status).toBe(transcribes ? "extracted" : "failed");
  await page.getByRole("link", { name: "Review next" }).click();
  await page.waitForURL(/\/capture\/review\?capture=/, { waitUntil: "commit" });
  await expect(page.getByText(/Take 1 of 1/)).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await page.getByRole("button", { name: "Discard", exact: true }).last().click();
  await page.waitForURL("**/capture/event", { waitUntil: "commit" });
  await expect(page.getByText(/^Discarded/)).toBeVisible();
  pass("an Event Mode take is uploaded and read on the server, then reviewed from the takes list");

  await page.goto(BASE + `/people/${personId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Delete Note/ }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL("**/people", { waitUntil: "commit" });
  const { count: notesLeft } = await admin.from("captures").select("id", { count: "exact", head: true }).eq("user_id", userId);
  const { data: audioLeft } = await admin.storage.from("audio").list(userId);
  expect(notesLeft).toBe(0);
  expect(audioLeft ?? []).toHaveLength(0);
  pass("deleting the person deletes their notes and recordings");
} catch (error) {
  out.push("FAIL " + String((error as Error).message).split("\n").slice(0, 4).join(" | "));
} finally {
  await browser.close();
  const { data: leftover } = await admin.storage.from("audio").list(userId);
  if (leftover?.length) await admin.storage.from("audio").remove(leftover.map((f) => `${userId}/${f.name}`));
  await admin.auth.admin.deleteUser(userId);
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", userId);
  out.push(count === 0 ? "PASS the test account was removed" : "FAIL the test account is still there");
}
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exitCode = 1;
