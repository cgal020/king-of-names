// Birthdays and follow-ups coming up soon: the in-app list that backs up
// push reminders (which iOS only delivers to installed apps, unreliably).
import type { Person } from "@/lib/types";

export type UpcomingItem = {
  person: Person;
  kind: "birthday" | "follow_up";
  // Calendar date as YYYY-MM-DD.
  date: string;
  // Whole days from today; negative when a follow-up is overdue.
  inDays: number;
};

const DAY = 86_400_000;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayDiff(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY);
}

// Next birthday on or after today. 29 February falls on the 28th in other years.
export function nextBirthday(month: number, day: number, today: Date) {
  for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const d = new Date(year, month - 1, month === 2 && day === 29 && !isLeap ? 28 : day);
    if (dayDiff(today, d) >= 0) return d;
  }
  return null;
}

export function upcoming(people: Person[], today: Date, withinDays = 42, overdueDays = 14): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const person of people) {
    if (person.birthday_month && person.birthday_day) {
      const next = nextBirthday(person.birthday_month, person.birthday_day, today);
      if (next) {
        const inDays = dayDiff(today, next);
        if (inDays <= withinDays) items.push({ person, kind: "birthday", date: ymd(next), inDays });
      }
    }
    if (person.follow_up_date) {
      const [y, m, d] = person.follow_up_date.split("-").map(Number);
      const inDays = dayDiff(today, new Date(y, m - 1, d));
      if (inDays <= withinDays && inDays >= -overdueDays) {
        items.push({ person, kind: "follow_up", date: person.follow_up_date, inDays });
      }
    }
  }
  return items.sort((a, b) => a.inDays - b.inDays);
}

export function whenLabel(inDays: number) {
  if (inDays < -1) return `${-inDays} days overdue`;
  if (inDays === -1) return "1 day overdue";
  if (inDays === 0) return "Today";
  if (inDays === 1) return "Tomorrow";
  if (inDays < 14) return `In ${inDays} days`;
  return `In ${Math.round(inDays / 7)} weeks`;
}
