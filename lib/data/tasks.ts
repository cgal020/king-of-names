import "server-only";
// Tasks for the user's people: open ones for Coming up, Ask and search, and
// one person's for their profile. The preview has none until you add some.
import { usingSampleData } from "@/lib/data/people";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

export const TASK_COLUMNS = "id, person_id, title, due_date, done_at, created_at";

export async function listOpenTasks(): Promise<Task[]> {
  if (usingSampleData()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select(TASK_COLUMNS).is("done_at", null).order("created_at");
  return (data ?? []) as Task[];
}

export async function listTasksFor(personId: string): Promise<Task[]> {
  if (usingSampleData() || !isPersonId(personId)) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("person_id", personId)
    .is("done_at", null)
    .order("created_at");
  return (data ?? []) as Task[];
}
