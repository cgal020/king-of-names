// Mockup stand-in for Ask AI. The real version sends the question to the
// extraction model with tools that query only the signed-in user's people,
// and must cite every person it mentions. This rule-based version answers the
// common question shapes over the sample data so the screens can be tried.
import { firstLine, formatBirthday, formatMetDate, formatShortDate, monthName } from "@/lib/format";
import type { Person } from "@/lib/types";

export type AskAnswer = {
  answer: string;
  people: { person: Person; reason: string }[];
  followUps: string[];
};

const STOPWORDS = new Set(
  ("who whom whose what when where which why how did do does is are was were have has can could should list show find " +
    "tell give any anyone i me my mine the a an in at on of to for from with and or about know knew met meet meeting " +
    "people person someone somebody work works working worked job does do there here this that these those all " +
    "while next week month year am be been being who's whos get got lives live based see visit catch up contact call " +
    "ping into like likes interested should would want else other others also").split(" "),
);

// Loose topic matching: a question about "shipping" should find "freight" and "logistics".
const SYNONYMS: Record<string, string[]> = {
  shipping: ["logistics", "freight", "cold-chain", "cargo", "trucks", "forwarder"],
  logistics: ["shipping", "freight", "cold-chain", "cargo", "trucks", "forwarder"],
  property: ["real estate", "property", "leasing", "hotel"],
  investor: ["fund", "venture", "family office", "banker", "invest"],
  investors: ["fund", "venture", "family office", "banker", "invest"],
  money: ["fund", "venture", "family office", "banker"],
  design: ["design", "studio", "architect", "fit-out"],
  hotels: ["hotel", "hospitality", "fit-out"],
  hotel: ["hotel", "hospitality", "fit-out"],
  food: ["restaurant", "restaurants", "wine bar"],
  restaurants: ["restaurant", "restaurants", "wine bar"],
  art: ["gallery", "art"],
  lawyer: ["lawyer", "legal", "leasing"],
  law: ["lawyer", "legal"],
  boats: ["yacht", "charter"],
  yachts: ["yacht", "charter"],
};

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fold(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

function haystack(p: Person) {
  return fold(
    [p.notes, p.where_met_text, p.place_name, p.extras.company, p.extras.role].filter(Boolean).join(" "),
  );
}

const names = (list: Person[]) =>
  list.length <= 2
    ? list.map((p) => p.full_name).join(" and ")
    : `${list.slice(0, -1).map((p) => p.full_name).join(", ")} and ${list.at(-1)!.full_name}`;

export function mockAnswer(question: string, people: Person[], now = new Date()): AskAnswer {
  const q = fold(question);
  const cities = [...new Set(people.map((p) => p.city).filter((c): c is string => Boolean(c)))];
  const countries = [...new Set(people.map((p) => p.country).filter((c): c is string => Boolean(c)))];
  const city = cities.find((c) => q.includes(fold(c)));
  const country = countries.find((c) => q.includes(fold(c)));
  const inPlace = people.filter((p) => (city ? p.city === city : country ? p.country === country : true));
  const placeName = city ?? country;

  // Birthdays
  if (/birthday|bday/.test(q)) {
    const month = /next month/.test(q) ? ((now.getMonth() + 1) % 12) + 1 : now.getMonth() + 1;
    const hits = inPlace
      .filter((p) => p.birthday_month === month)
      .sort((a, b) => (a.birthday_day ?? 0) - (b.birthday_day ?? 0));
    const upcoming = inPlace
      .filter((p) => p.birthday_month)
      .sort((a, b) => ((a.birthday_month! - month + 12) % 12) - ((b.birthday_month! - month + 12) % 12))
      .filter((p) => p.birthday_month !== month)[0];
    return {
      answer: hits.length
        ? `${hits.length === 1 ? "One birthday" : `${hits.length} birthdays`} in ${monthName(month)}: ${names(hits)}.`
        : `No birthdays in ${monthName(month)} in your notes.${
            upcoming ? ` The next one is ${upcoming.full_name} on ${formatBirthday(upcoming.birthday_day, upcoming.birthday_month, null)}.` : ""
          }`,
      people: (hits.length ? hits : upcoming ? [upcoming] : []).map((p) => ({
        person: p,
        reason: `Birthday ${formatBirthday(p.birthday_day, p.birthday_month, p.birthday_year)}`,
      })),
      followUps: ["Whose birthday is next month?", "Which follow-ups are coming up?"],
    };
  }

  // Follow-ups
  if (/follow|remind|owe|promised|to do|todo/.test(q)) {
    const today = now.toISOString().slice(0, 10);
    const hits = inPlace
      .filter((p) => p.follow_up_note || p.follow_up_date)
      .sort((a, b) => (a.follow_up_date ?? "9999").localeCompare(b.follow_up_date ?? "9999"));
    const overdue = hits.filter((p) => p.follow_up_date && p.follow_up_date < today);
    return {
      answer: hits.length
        ? `${hits.length === 1 ? "One follow-up" : `${hits.length} follow-ups`}${placeName ? ` in ${placeName}` : ""}. The first is ${hits[0].full_name}${
            hits[0].follow_up_date ? ` on ${formatShortDate(hits[0].follow_up_date)}` : ""
          }: ${hits[0].follow_up_note ?? "no note"}.${overdue.length ? ` ${overdue.length} ${overdue.length === 1 ? "is" : "are"} overdue.` : ""}`
        : `You have no follow-ups noted${placeName ? ` in ${placeName}` : ""}.`,
      people: hits.map((p) => ({
        person: p,
        reason: [p.follow_up_date && formatShortDate(p.follow_up_date), p.follow_up_note].filter(Boolean).join(" · "),
      })),
      followUps: ["Whose birthday is this month?", "Who did I meet most recently?"],
    };
  }

  // A named person: "what did I note about Omar?"
  const named = people.filter((p) =>
    fold(p.full_name)
      .replace(/[“”"]/g, "")
      .split(/\s+/)
      .some((part) => part.length > 2 && new RegExp(`\\b${escapeRegExp(part)}\\b`).test(q)),
  );
  if (named.length === 1) {
    const p = named[0];
    return {
      answer: `${p.notes ?? "You didn't note much about them."} Where you met: ${
        p.where_met_text ?? p.place_name ?? "not recorded"
      } (${[p.city, formatMetDate(p.met_at, p.met_timezone)].filter(Boolean).join(", ")}).${
        p.follow_up_note ? ` Open follow-up: ${p.follow_up_note}.` : ""
      }`,
      people: [{ person: p, reason: [p.city, formatMetDate(p.met_at, p.met_timezone)].filter(Boolean).join(" · ") }],
      followUps: [`Who else did I meet in ${p.city ?? "that city"}?`, "Which follow-ups are coming up?"],
    };
  }

  // Most recent
  if (/recent|latest|last/.test(q)) {
    const hits = [...inPlace].sort((a, b) => b.met_at.localeCompare(a.met_at)).slice(0, 3);
    return {
      answer: `Most recently${placeName ? ` in ${placeName}` : ""}: ${names(hits)}.`,
      people: hits.map((p) => ({ person: p, reason: `${p.city ?? ""} · ${formatMetDate(p.met_at, p.met_timezone)}` })),
      followUps: ["Which follow-ups are coming up?"],
    };
  }

  // A place that isn't in the data at all: "who do I know in Paris?"
  const unknownPlace = !placeName && question.match(/\b(?:in|from|at)\s+(\p{Lu}[\p{L}-]+(?:\s+\p{Lu}[\p{L}-]+)?)/u)?.[1];
  if (unknownPlace) {
    return {
      answer: `You haven't met anyone in ${unknownPlace} yet.`,
      people: [],
      followUps: ["Who do I know in Dubai?", "Who did I meet most recently?"],
    };
  }

  // Topic, optionally in a place: "who did I meet in Dubai who works in shipping?"
  const placeWords = new Set([...(city ? fold(city).split(/\s+/) : []), ...(country ? fold(country).split(/\s+/) : [])]);
  const topics = q
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !placeWords.has(w));
  if (topics.length) {
    const terms = topics.flatMap((t) => [
      t,
      ...(t.length > 4 && t.endsWith("s") ? [t.slice(0, -1)] : []),
      ...(SYNONYMS[t] ?? []),
    ]);
    const hits = inPlace.filter((p) => terms.some((t) => haystack(p).includes(t)));
    return {
      answer: hits.length
        ? `${hits.length === 1 ? "One person" : `${hits.length} people`}${placeName ? ` in ${placeName}` : ""} ${
            hits.length === 1 ? "matches" : "match"
          }: ${names(hits)}.`
        : `I couldn't find anyone${placeName ? ` in ${placeName}` : ""} whose notes mention ${topics.join(" or ")}.`,
      people: hits.map((p) => ({ person: p, reason: firstLine(p.notes) })),
      followUps: placeName ? [`Who else do I know in ${placeName}?`] : ["Who do I know in Dubai?"],
    };
  }

  // Just a place: "who do I know in Bangkok?"
  if (placeName) {
    const sorted = [...inPlace].sort(
      (a, b) => Number(Boolean(b.follow_up_note)) - Number(Boolean(a.follow_up_note)) || b.met_at.localeCompare(a.met_at),
    );
    const withFollowUp = sorted.filter((p) => p.follow_up_note);
    return {
      answer: sorted.length
        ? `You know ${sorted.length === 1 ? "one person" : `${sorted.length} people`} in ${placeName}: ${names(sorted)}.${
            withFollowUp.length ? ` ${withFollowUp[0].full_name} has an open follow-up.` : ""
          }`
        : `You haven't met anyone in ${placeName} yet.`,
      people: sorted.map((p) => ({ person: p, reason: firstLine(p.notes) })),
      followUps: [`Whose birthday is this month?`, `Which follow-ups are coming up?`],
    };
  }

  return {
    answer: "I couldn't match that to anything in your notes. Try a place, a topic or a name.",
    people: [],
    followUps: ["Who do I know in Bangkok?", "Who works in logistics or shipping?"],
  };
}
