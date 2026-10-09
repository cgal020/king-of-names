import { describe, expect, it } from "vitest";
import { getMockPerson } from "@/lib/mock/people";
import { daysUntil, nextBirthday, snoozedDate, upcoming, whenLabel } from "@/lib/upcoming";
import type { Person } from "@/lib/types";

const base = getMockPerson("isabella-rossi")!;
const person = (overrides: Partial<Person>): Person => ({ ...base, id: crypto.randomUUID(), ...overrides });
const today = new Date(2026, 9, 7); // 7 Oct 2026, local time

describe("upcoming", () => {
  it("lists birthdays and follow-ups in date order, overdue first, never dropping an overdue one", () => {
    const items = upcoming(
      [
        person({ full_name: "Late", follow_up_date: "2026-10-01" }),
        person({ full_name: "Soon", birthday_month: 10, birthday_day: 9 }),
        person({ full_name: "Later", follow_up_date: "2026-11-10" }),
        person({ full_name: "Too far", birthday_month: 12, birthday_day: 25 }),
        person({ full_name: "Long overdue", follow_up_date: "2026-08-01" }),
      ],
      today,
    );
    expect(items.map((i) => [i.person.full_name, i.kind, i.inDays])).toEqual([
      ["Long overdue", "follow_up", -67],
      ["Late", "follow_up", -6],
      ["Soon", "birthday", 2],
      ["Later", "follow_up", 34],
    ]);
  });

  it("rolls birthdays that have passed into next year", () => {
    expect(nextBirthday(1, 19, today)?.getFullYear()).toBe(2027);
    expect(nextBirthday(10, 7, today)?.getDate()).toBe(7);
  });

  it("puts 29 February birthdays on the 28th in non-leap years", () => {
    const d = nextBirthday(2, 29, today)!;
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2027, 2, 28]);
  });

  it("snoozes a follow-up to a week from today", () => {
    expect(snoozedDate(today)).toBe("2026-10-14");
    expect(snoozedDate(new Date(2026, 11, 28))).toBe("2027-01-04");
    expect(daysUntil("2026-10-01", today)).toBe(-6);
  });

  it("labels days in plain words", () => {
    expect(whenLabel(-3)).toBe("3 days overdue");
    expect(whenLabel(0)).toBe("Today");
    expect(whenLabel(1)).toBe("Tomorrow");
    expect(whenLabel(5)).toBe("In 5 days");
    expect(whenLabel(21)).toBe("In 3 weeks");
  });
});
