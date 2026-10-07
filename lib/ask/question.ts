// Decides when the People search box should offer "Ask AI" instead of, or as
// well as, a plain text search.

const QUESTION_START =
  /^(who|whom|whose|what|when|where|which|why|how|did|do|does|is|are|was|were|have|has|can|could|should|list|show|find|tell|give|any|anyone)\b/i;

export function looksLikeQuestion(text: string) {
  const t = text.trim();
  if (t.length < 8) return false;
  return t.endsWith("?") || (QUESTION_START.test(t) && t.split(/\s+/).length >= 3);
}

export const SUGGESTED_QUESTIONS = [
  "Who do I know in Bangkok?",
  "Who are my investors?",
  "Which follow-ups are coming up?",
  "Whose birthday is this month?",
  "Who works in logistics or shipping?",
];
