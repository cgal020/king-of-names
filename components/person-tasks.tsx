"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, PlusIcon } from "lucide-react";
import { addTask, setTaskDone } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authConfigured } from "@/lib/auth/config";
import { formatShortDate } from "@/lib/format";
import type { Task } from "@/lib/types";
import { daysUntil, whenLabel } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
const todayKey = () => new Date().toDateString();

// Due ones first, soonest first; then the rest in the order they were added.
const byDue = (a: Task, b: Task) =>
  (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.created_at.localeCompare(b.created_at);

// A person's tasks and reminders: tick one off, or add one with an optional
// due date. Due ones also show in Coming up.
export function PersonTasks({ personId, initial }: { personId: string; initial: Task[] }) {
  const router = useRouter();
  const today = useSyncExternalStore(noSubscribe, todayKey, () => null);
  const [tasks, setTasks] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!title.trim() || saving) return;
    setSaving(true);
    const result = await addTask(personId, title, due || null).catch(() => ({
      ok: false as const,
      error: "That didn’t save. Check your connection and try again.",
    }));
    setSaving(false);
    if (!result.ok) return void toast.error(result.error);
    setTasks((list) => [...list, result.task]);
    setTitle("");
    setDue("");
    setAdding(false);
    toast.success("Task added", { description: authConfigured() ? undefined : "Preview only. Nothing was stored." });
    router.refresh();
  }

  async function done(task: Task) {
    setTasks((list) => list.filter((t) => t.id !== task.id));
    const result = await setTaskDone(task.id, true).catch(() => ({ ok: false }));
    if (!result.ok) {
      setTasks((list) => [...list, task]);
      return void toast.error("That didn’t save", { description: "Check your connection and try again." });
    }
    router.refresh();
    toast.success("Task done", {
      action: {
        label: "Undo",
        onClick: () => {
          setTasks((list) => [...list, task]);
          void setTaskDone(task.id, false).then(() => router.refresh());
        },
      },
    });
  }

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="type-section">Tasks</h2>
        {!adding && (
          <Button variant="ghost" size="touch" className="-mr-3 text-primary" onClick={() => setAdding(true)}>
            <PlusIcon aria-hidden />
            Add a task
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-4 space-y-3 rounded-2xl bg-muted p-4">
          <div>
            <label htmlFor="new-task" className="mb-1.5 block text-sm font-medium">
              What to do
            </label>
            <Input
              id="new-task"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void add()}
              placeholder="Send the deck, introduce to Omar…"
              className="bg-background"
            />
          </div>
          <div>
            <label htmlFor="new-task-due" className="mb-1.5 block text-sm font-medium">
              Remind me on <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input id="new-task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="bg-background" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="touch" className="flex-1" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="touch" className="flex-[2]" disabled={!title.trim() || saving} onClick={() => void add()}>
              {saving ? "Saving…" : "Add task"}
            </Button>
          </div>
        </div>
      )}

      {tasks.length > 0 ? (
        <ul className="divide-y border-y">
          {[...tasks].sort(byDue).map((task) => {
            const inDays = today && task.due_date ? daysUntil(task.due_date, new Date(today)) : null;
            return (
              <li key={task.id} className="flex items-start gap-3 py-3">
                <button
                  type="button"
                  aria-label={`Mark “${task.title}” done`}
                  onClick={() => void done(task)}
                  className="group/tick -m-2 grid size-9 shrink-0 place-items-center rounded-full"
                >
                  <span className="grid size-5 place-items-center rounded-full border-2 border-primary text-primary transition-colors group-hover/tick:bg-primary/10 group-active/tick:bg-primary group-active/tick:text-primary-foreground">
                    <CheckIcon className="size-3 opacity-0 group-hover/tick:opacity-100 group-active/tick:opacity-100" strokeWidth={3} />
                  </span>
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1rem]">{task.title}</span>
                  {task.due_date && (
                    <span className={cn("block text-sm", inDays !== null && inDays < 0 ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {formatShortDate(task.due_date)}
                      {inDays !== null && inDays <= 1 && <> &middot; {whenLabel(inDays)}</>}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        !adding && <p className="text-[0.95rem] text-muted-foreground">Nothing to do for them yet.</p>
      )}
    </section>
  );
}
