// Relationship and "how they could help" tags. The starter list is a
// suggestion; users add their own tags as they go.

export type Relationship = "business" | "personal" | "both";

export const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "both", label: "Both" },
];

export const STARTER_TAGS = ["Investor", "Client", "Partner", "Supplier", "Connector", "Advisor", "Talent", "Friend"];

export function relationshipLabel(value: Relationship | null) {
  return RELATIONSHIPS.find((r) => r.value === value)?.label ?? null;
}

// Trims, collapses spaces and capitalises the first letter, so "  bangkok intro"
// and "Bangkok intro" are one tag.
export function cleanTag(raw: string) {
  const tag = raw.trim().replace(/\s+/g, " ").slice(0, 32);
  return tag ? tag[0].toLocaleUpperCase() + tag.slice(1) : "";
}

// Adds a tag unless it is already there in any letter case.
export function addTag(tags: string[], raw: string) {
  const tag = cleanTag(raw);
  if (!tag || tags.some((t) => t.toLocaleLowerCase() === tag.toLocaleLowerCase())) return tags;
  return [...tags, tag];
}

export function removeTag(tags: string[], tag: string) {
  return tags.filter((t) => t.toLocaleLowerCase() !== tag.toLocaleLowerCase());
}

// Every tag the user has used, most used first, then the starter tags.
export function knownTags(people: { tags: string[] }[]) {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const p of people) {
    for (const tag of p.tags) {
      const key = tag.toLocaleLowerCase();
      const entry = counts.get(key) ?? { tag, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  const used = [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)).map((e) => e.tag);
  const starters = STARTER_TAGS.filter((t) => !counts.has(t.toLocaleLowerCase()));
  return [...used, ...starters];
}
