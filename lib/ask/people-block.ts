// What Ask AI sees of the user's people: one line each, without phone numbers
// or email addresses. Shared by the server's Ask and its tests.
import type { Encounter, Person, Task } from "@/lib/types";

// One line per person, in a stable order so the list can be cached. Each is
// labelled P1, P2...: a model copies a short label reliably, where it can
// mix up two 36-character ids. `byRef` turns the labels back into people.
export function peopleBlock(people: Person[], laterMeetings: Encounter[], tasks: Task[] = []): { text: string; byRef: Map<string, Person> } {
  const later = new Map<string, Encounter[]>();
  for (const m of laterMeetings) later.set(m.person_id, [...(later.get(m.person_id) ?? []), m]);
  const clip = (text: string | null | undefined, max: number) =>
    text ? (text.length > max ? `${text.slice(0, max - 1)}…` : text).replace(/\s+/g, " ") : null;
  const byRef = new Map<string, Person>();
  const lines = [...people]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p, i) => {
      const ref = `P${i + 1}`;
      byRef.set(ref, p);
      const fields = [
        `ref: ${ref}`,
        `name: ${p.full_name}`,
        p.imported_at
          ? "first met: unknown (imported from contacts)"
          : `first met: ${p.met_at.slice(0, 10)}${[p.place_name, p.city, p.country].filter(Boolean).length ? ` at ${[p.place_name, p.city, p.country].filter(Boolean).join(", ")}` : ""}`,
        p.where_met_text && `where, in their words: ${clip(p.where_met_text, 120)}`,
        (p.extras.role || p.extras.company) && `work: ${[p.extras.role, p.extras.company].filter(Boolean).join(", ")}`,
        p.relationship && `relationship: ${p.relationship}`,
        p.tags.length > 0 && `tags: ${p.tags.join(", ")}`,
        p.notes && `notes: ${clip(p.notes, 400)}`,
        (p.follow_up_note || p.follow_up_date) && `follow-up: ${[p.follow_up_note, p.follow_up_date && `due ${p.follow_up_date}`].filter(Boolean).join(", ")}`,
        p.birthday_month && p.birthday_day && `birthday: ${String(p.birthday_month).padStart(2, "0")}-${String(p.birthday_day).padStart(2, "0")}`,
        ...tasks
          .filter((t) => t.person_id === p.id && !t.done_at)
          .slice(0, 5)
          .map((t) => `to do: ${clip(t.title, 120)}${t.due_date ? ` (due ${t.due_date})` : ""}`),
        ...(later.get(p.id) ?? [])
          .slice(0, 5)
          .map((m) => `met again ${m.met_at.slice(0, 10)}${m.city ? ` in ${m.city}` : ""}${m.note ? `: ${clip(m.note, 160)}` : ""}`),
      ].filter(Boolean);
      return fields.join(" | ");
    });
  return { text: `<people>\n${lines.join("\n")}\n</people>`, byRef };
}

