// Proves that one account can never read or change another account's people,
// captures, profile or audio. Runs against a real Supabase project because
// row level security only exists in Postgres. See README "Running tests".
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireEnv } from "./env";

const env = requireEnv();

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.url, env.serviceKey, clientOptions);

type TestUser = { id: string; client: SupabaseClient };

async function createTestUser(label: string): Promise<TestUser> {
  const suffix = randomBytes(4).toString("hex");
  const email = `rls-${label}-${suffix}@example.com`;
  const password = randomUUID();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: `rls_${label}_${suffix}` },
  });
  if (error) throw error;

  const client = createClient(env.url, env.anonKey, clientOptions);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { id: data.user.id, client };
}

describe("row level security between two accounts", () => {
  let a: TestUser;
  let b: TestUser;
  let personId: string;
  let captureId: string;
  let audioPath: string;
  let photoId: string;
  let photoPath: string;

  beforeAll(async () => {
    [a, b] = await Promise.all([createTestUser("a"), createTestUser("b")]);

    const { data: person, error: personError } = await a.client
      .from("people")
      .insert({ full_name: "Daniel Reyes", met_at: new Date().toISOString(), notes: "secret note" })
      .select("id")
      .single();
    if (personError) throw personError;
    personId = person.id;

    audioPath = `${a.id}/${randomUUID()}.webm`;
    const { error: uploadError } = await a.client.storage
      .from("audio")
      .upload(audioPath, new Blob([new Uint8Array(16)], { type: "audio/webm" }), {
        contentType: "audio/webm",
      });
    if (uploadError) throw uploadError;

    const { data: capture, error: captureError } = await a.client
      .from("captures")
      .insert({ audio_path: audioPath, audio_mime: "audio/webm", transcript: "secret transcript" })
      .select("id")
      .single();
    if (captureError) throw captureError;
    captureId = capture.id;

    photoPath = `${a.id}/${randomUUID()}.jpg`;
    const { error: photoUploadError } = await a.client.storage
      .from("photos")
      .upload(photoPath, new Blob([new Uint8Array(16)], { type: "image/jpeg" }), {
        contentType: "image/jpeg",
      });
    if (photoUploadError) throw photoUploadError;

    const { data: photo, error: photoError } = await a.client
      .from("photos")
      .insert({
        person_id: personId,
        kind: "person",
        storage_path: photoPath,
        mime: "image/jpeg",
        lat: 25.08,
        lng: 55.14,
        location_source: "device",
      })
      .select("id")
      .single();
    if (photoError) throw photoError;
    photoId = photo.id;
  });

  afterAll(async () => {
    if (audioPath) await admin.storage.from("audio").remove([audioPath]);
    if (photoPath) await admin.storage.from("photos").remove([photoPath]);
    // Deleting the auth user cascades to profiles, people and captures.
    await Promise.all([a, b].filter(Boolean).map((u) => admin.auth.admin.deleteUser(u.id)));
  });

  it("lets the owner read their own rows", async () => {
    const people = await a.client.from("people").select("id").eq("id", personId);
    const captures = await a.client.from("captures").select("id").eq("id", captureId);
    expect(people.data).toHaveLength(1);
    expect(captures.data).toHaveLength(1);
  });

  it("hides another user's people", async () => {
    const byId = await b.client.from("people").select("*").eq("id", personId);
    const all = await b.client.from("people").select("*");
    expect(byId.error).toBeNull();
    expect(byId.data).toEqual([]);
    expect(all.data).toEqual([]);
  });

  it("hides another user's captures", async () => {
    const byId = await b.client.from("captures").select("*").eq("id", captureId);
    const all = await b.client.from("captures").select("*");
    expect(byId.data).toEqual([]);
    expect(all.data).toEqual([]);
  });

  it("hides another user's profile", async () => {
    const { data } = await b.client.from("profiles").select("*").eq("id", a.id);
    expect(data).toEqual([]);
  });

  it("blocks updating or deleting another user's rows", async () => {
    const updated = await b.client
      .from("people")
      .update({ notes: "tampered" })
      .eq("id", personId)
      .select();
    const deletedPerson = await b.client.from("people").delete().eq("id", personId).select();
    const deletedCapture = await b.client.from("captures").delete().eq("id", captureId).select();

    expect(updated.data).toEqual([]);
    expect(deletedPerson.data).toEqual([]);
    expect(deletedCapture.data).toEqual([]);

    const { data: stillThere } = await admin
      .from("people")
      .select("notes")
      .eq("id", personId)
      .single();
    expect(stillThere?.notes).toBe("secret note");
  });

  it("blocks inserting rows owned by another user", async () => {
    const person = await b.client
      .from("people")
      .insert({ user_id: a.id, full_name: "Planted", met_at: new Date().toISOString() });
    const capture = await b.client.from("captures").insert({ user_id: a.id });
    expect(person.error?.code).toBe("42501");
    expect(capture.error?.code).toBe("42501");
  });

  it("blocks moving your own row into another user's account", async () => {
    const { data: own } = await b.client
      .from("people")
      .insert({ full_name: "Own person", met_at: new Date().toISOString() })
      .select("id")
      .single();
    const moved = await b.client.from("people").update({ user_id: a.id }).eq("id", own!.id);
    expect(moved.error?.code).toBe("42501");
  });

  it("hides another user's audio", async () => {
    const download = await b.client.storage.from("audio").download(audioPath);
    const signed = await b.client.storage.from("audio").createSignedUrl(audioPath, 60);
    const listing = await b.client.storage.from("audio").list(a.id);

    expect(download.data).toBeNull();
    expect(signed.data).toBeNull();
    expect(listing.data ?? []).toEqual([]);
  });

  it("blocks writing into another user's audio folder", async () => {
    const { error } = await b.client.storage
      .from("audio")
      .upload(`${a.id}/${randomUUID()}.webm`, new Blob([new Uint8Array(4)], { type: "audio/webm" }), {
        contentType: "audio/webm",
      });
    expect(error).not.toBeNull();
  });

  it("hides another user's photos and photo files", async () => {
    const rows = await b.client.from("photos").select("*").eq("id", photoId);
    const download = await b.client.storage.from("photos").download(photoPath);
    const signed = await b.client.storage.from("photos").createSignedUrl(photoPath, 60);
    expect(rows.data).toEqual([]);
    expect(download.data).toBeNull();
    expect(signed.data).toBeNull();
  });

  it("blocks linking your own rows to another user's person", async () => {
    // Owned by B, but pointing at A's person: the same-user foreign keys refuse it.
    const photo = await b.client
      .from("photos")
      .insert({ person_id: personId, storage_path: `${b.id}/x.jpg`, mime: "image/jpeg" });
    const capture = await b.client.from("captures").insert({ person_id: personId });
    expect(photo.error).not.toBeNull();
    expect(capture.error).not.toBeNull();
  });

  it("gives clients no access to invite codes", async () => {
    const { error } = await a.client.from("invite_codes").select("*");
    expect(error?.code).toBe("42501");
  });

  it("gives signed-out visitors nothing", async () => {
    const anon = createClient(env.url, env.anonKey, clientOptions);
    const people = await anon.from("people").select("*");
    const captures = await anon.from("captures").select("*");
    expect(people.data ?? []).toEqual([]);
    expect(captures.data ?? []).toEqual([]);
  });
});
