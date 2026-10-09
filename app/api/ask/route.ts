// Ask AI. The question, the last few in the thread, and the signed-in user's
// own people go to Claude; the answer comes back with the people it used.
// Signed-in users only. Never logs questions, answers or names.
import { z } from "zod";
import { askAboutPeople } from "@/lib/ai/ask";
import { authConfigured } from "@/lib/auth/config";
import { listLaterMeetings, listPeople } from "@/lib/data/people";
import { listOpenTasks } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const isTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const Body = z.object({
  question: z.string().trim().min(1).max(300),
  history: z
    .array(z.object({ question: z.string().max(300), answer: z.string().max(1200) }))
    .max(3)
    .default([]),
  timeZone: z.string().max(64).refine(isTimeZone).nullable().default(null),
});

export async function POST(request: Request) {
  if (!authConfigured()) return Response.json({ error: "Accounts aren't connected." }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return Response.json({ error: "Sign in first." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ask a question of up to 300 characters." }, { status: 400 });

  const [people, laterMeetings, tasks] = await Promise.all([listPeople(), listLaterMeetings(), listOpenTasks()]);
  if (!people.length) {
    return Response.json({ answer: "You haven’t saved anyone yet, so there’s nothing to search.", people: [], followUps: [] });
  }
  try {
    const result = await askAboutPeople({ ...parsed.data, people, laterMeetings, tasks, now: new Date() });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("ask failed", { name: (error as Error).name, status: (error as { status?: number }).status ?? null });
    return Response.json({ error: "Couldn’t answer that right now." }, { status: 503 });
  }
}
