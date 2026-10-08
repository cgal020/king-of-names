// Tools the King of Names connector offers Claude and ChatGPT over MCP.
// Read-only: assistants can search and read, never change or delete.
// The data source is passed in, so the real app can query Supabase with the
// signed-in user's token (row level security keeps it to their own people).
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { distanceKm, formatBirthday, formatMetDate } from "@/lib/format";
import type { Encounter, Person } from "@/lib/types";
import { upcoming } from "@/lib/upcoming";

export type PeopleSource = {
  people: () => Promise<Person[]>;
  meetings: (personId: string) => Promise<Encounter[]>;
};

export const SERVER_INSTRUCTIONS =
  "King of Names holds the user's private notes about people they have met: where and when, what they talked about, " +
  "tags for how each person could help, birthdays and follow-ups. Use these tools only to answer the user's own " +
  "questions. Cite people by name. Never invent people or details; if a search returns nothing, say so plainly. " +
  "Do not repeat phone numbers or emails unless the user asks for them.";

function fold(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

// A compact summary for lists.
function summary(p: Person) {
  return {
    id: p.id,
    name: p.full_name,
    met: formatMetDate(p.met_at, p.met_timezone),
    met_at: p.met_at,
    where: p.where_met_text ?? p.place_name,
    city: p.city,
    country: p.country,
    relationship: p.relationship,
    tags: p.tags,
    company: p.extras.company ?? null,
    role: p.extras.role ?? null,
    notes: p.notes,
  };
}

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

export function registerPeopleTools(server: McpServer, source: PeopleSource) {
  server.registerTool(
    "search_people",
    {
      title: "Search people",
      description:
        "Find people the user has met. Every filter is optional and they combine. `query` matches names, notes, " +
        "where they met, company, role and tags (case- and accent-insensitive). Use `city` or `country` for where " +
        "they were met, `tag` for how they could help (e.g. Investor, Partner, Logistics), and `relationship` for " +
        "business or personal (both counts for either). Results are newest meeting first.",
      inputSchema: z.object({
        query: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        tag: z.string().optional(),
        relationship: z.enum(["business", "personal"]).optional(),
        met_after: z.string().date().optional().describe("YYYY-MM-DD"),
        met_before: z.string().date().optional().describe("YYYY-MM-DD"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    },
    async ({ query, city, country, tag, relationship, met_after, met_before, limit }) => {
      const terms = query ? fold(query).split(/\s+/).filter(Boolean) : [];
      const matches = (await source.people())
        .filter((p) => {
          if (city && fold(p.city ?? "") !== fold(city)) return false;
          if (country && fold(p.country ?? "") !== fold(country)) return false;
          if (tag && !p.tags.some((t) => fold(t) === fold(tag))) return false;
          if (relationship && p.relationship !== relationship && p.relationship !== "both") return false;
          if (met_after && p.met_at.slice(0, 10) < met_after) return false;
          if (met_before && p.met_at.slice(0, 10) > met_before) return false;
          const haystack = fold(
            [p.full_name, p.notes, p.where_met_text, p.place_name, p.city, p.extras.company, p.extras.role, ...p.tags]
              .filter(Boolean)
              .join(" "),
          );
          return terms.every((t) => haystack.includes(t));
        })
        .sort((a, b) => b.met_at.localeCompare(a.met_at));
      return text({ count: matches.length, people: matches.slice(0, limit).map(summary) });
    },
  );

  server.registerTool(
    "get_person",
    {
      title: "Get a person",
      description:
        "Everything the user noted about one person, by id from search_people: profile, every meeting, " +
        "follow-up and birthday.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const person = (await source.people()).find((p) => p.id === id);
      if (!person) return { ...text({ error: "No person with that id." }), isError: true };
      const meetings = await source.meetings(id);
      return text({
        ...summary(person),
        phone: person.phone,
        email: person.extras.email ?? null,
        birthday: formatBirthday(person.birthday_day, person.birthday_month, person.birthday_year),
        follow_up: person.follow_up_note ? { note: person.follow_up_note, date: person.follow_up_date } : null,
        meetings: meetings.map((m) => ({
          date: formatMetDate(m.met_at, m.met_timezone),
          where: m.where_met_text ?? [m.place_name, m.city].filter(Boolean).join(", "),
          note: m.note,
        })),
      });
    },
  );

  server.registerTool(
    "coming_up",
    {
      title: "Birthdays and follow-ups coming up",
      description: "Birthdays and follow-ups due in the next `days` days, plus follow-ups up to two weeks overdue.",
      inputSchema: z.object({ days: z.number().int().min(1).max(365).default(30) }),
    },
    async ({ days }) => {
      const items = upcoming(await source.people(), new Date(), days);
      return text(
        items.map((i) => ({
          name: i.person.full_name,
          id: i.person.id,
          type: i.kind,
          date: i.date,
          in_days: i.inDays,
          follow_up: i.kind === "follow_up" ? i.person.follow_up_note : null,
        })),
      );
    },
  );

  server.registerTool(
    "people_near",
    {
      title: "People met near a place",
      description: "People the user met within `radius_km` of a point, nearest first. Pass coordinates of a venue or city.",
      inputSchema: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radius_km: z.number().min(0.1).max(500).default(5),
      }),
    },
    async ({ latitude, longitude, radius_km }) => {
      const near = (await source.people())
        .filter((p) => p.lat !== null && p.lng !== null)
        .map((p) => ({ p, km: distanceKm(latitude, longitude, p.lat!, p.lng!) }))
        .filter((r) => r.km <= radius_km)
        .sort((a, b) => a.km - b.km);
      return text(near.map(({ p, km }) => ({ ...summary(p), distance_km: Math.round(km * 10) / 10 })));
    },
  );
}
