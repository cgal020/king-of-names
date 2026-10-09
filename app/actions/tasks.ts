"use server";

// Tasks and reminders for a person: add one, tick it off (or back), move its
// date. In the preview nothing is stored.
import { revalidatePath } from "next/cache";
import { authConfigured } from "@/lib/auth/config";
import { TASK_COLUMNS } from "@/lib/data/tasks";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

const refresh = (personId: string) => {
  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
};

export async function addTask(
  personId: string,
  title: string,
  dueDate: string | null,
): Promise<{ ok: true; task: Task } | { ok: false; error: string }> {
  const text = typeof title === "string" ? title.trim().replace(/\s+/g, " ") : "";
  if (!text) return { ok: false, error: "Write what to do first." };
  if (text.length > 300) return { ok: false, error: "Keep it under 300 characters." };
  const due = isDate(dueDate) ? dueDate : null;
  if (!authConfigured()) {
    return { ok: true, task: { id: crypto.randomUUID(), person_id: personId, title: text, due_date: due, done_at: null, created_at: new Date().toISOString() } };
  }
  if (!isPersonId(personId)) return { ok: false, error: "That person no longer exists." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ person_id: personId, title: text, due_date: due })
    .select(TASK_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: "That didn’t save. Check your connection and try again." };
  refresh(personId);
  return { ok: true, task: data as Task };
}

export async function setTaskDone(id: string, done: boolean): Promise<{ ok: boolean }> {
  if (!authConfigured()) return { ok: true };
  if (!isPersonId(id)) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select("person_id")
    .maybeSingle();
  if (error || !data) return { ok: false };
  refresh(data.person_id as string);
  return { ok: true };
}

export async function setTaskDue(id: string, dueDate: string | null): Promise<{ ok: boolean }> {
  if (!authConfigured()) return { ok: true };
  if (!isPersonId(id)) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ due_date: isDate(dueDate) ? dueDate : null })
    .eq("id", id)
    .select("person_id")
    .maybeSingle();
  if (error || !data) return { ok: false };
  refresh(data.person_id as string);
  return { ok: true };
}
