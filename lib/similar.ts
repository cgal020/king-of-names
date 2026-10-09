// Name similarity for the "Already met?" duplicate check. It runs on the phone
// over the user's own people, which are already loaded for the form.
function normalize(name: string) {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export function findSimilar<T extends { full_name: string }>(name: string, people: T[]) {
  const target = normalize(name);
  if (target.length < 3) return [];
  return people.filter((p) => {
    const other = normalize(p.full_name);
    return other === target || editDistance(other, target) <= Math.max(1, Math.floor(target.length / 6));
  });
}
