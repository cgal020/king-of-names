// Two letters for an avatar or a map pin, taken from the name in its own
// script: first letters of the first and last name, so
// "Siriporn “Nok” Srisawat" gives "SS" and سارة الحداد gives سح.
export function initials(name: string) {
  const words = name
    .replace(/[“”"'()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  const first = Array.from(words[0])[0] ?? "";
  // Skip the Arabic article: الحداد gives ح, not ا.
  const lastWord = words.length > 1 ? words.at(-1)!.replace(/^ال(?=.)/, "") : "";
  const last = Array.from(lastWord)[0] ?? "";
  return (first + last).toUpperCase();
}
