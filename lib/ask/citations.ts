// Turns the people an Ask answer cites back into the user's own people. A
// citation is kept only when its label and its name agree; if they don't,
// the name decides, when it fits exactly one person. Anything else is
// dropped, so a card under an answer is always the person the answer means.
import type { Person } from "@/lib/types";

export type Citation = { ref: string; name: string; reason: string };

const tokens = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

// "Nattapong" or "Nattapong Srisuk" is Nattapong Srisuk; "Aisha" is not.
export function sameName(fullName: string, said: string) {
  const full = tokens(fullName);
  const named = tokens(said);
  if (!full.length || !named.length) return false;
  return named.every((t) => full.includes(t)) || full.every((t) => named.includes(t));
}

export function resolveCitations(cited: Citation[], byRef: Map<string, Person>, people: Person[], max = 12) {
  const out: { id: string; reason: string }[] = [];
  for (const c of cited) {
    const labelled = byRef.get(c.ref.trim().toUpperCase());
    let person = labelled && sameName(labelled.full_name, c.name) ? labelled : null;
    if (!person) {
      const byName = people.filter((p) => sameName(p.full_name, c.name));
      person = byName.length === 1 ? byName[0] : null;
    }
    if (!person || out.some((o) => o.id === person.id)) continue;
    out.push({ id: person.id, reason: c.reason.trim().slice(0, 160) });
  }
  return out.slice(0, max);
}
