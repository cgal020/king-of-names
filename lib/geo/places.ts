// Place names as people say them. Mapbox names areas the way governments map
// them ("Marsa Dubai", "Za'abeel Second", "Bayfront Subzone", "Barangay 655");
// people say Dubai Marina, DIFC, Marina Bay and Intramuros. Kept small: only
// the business districts of the app's three markets that came up wrong.

const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Official name -> the name people use, shown and stored instead.
const COMMON_NAMES: Record<string, string> = {
  "marsa dubai": "Dubai Marina",
  "zaabeel second": "DIFC",
  "bayfront": "Marina Bay",
  "fort bonifacio": "BGC",
  "bonifacio global city": "BGC",
  "barangay 655": "Intramuros",
};

// The name shown for an area, or null when the official one means nothing
// to anyone (Manila's numbered barangays, say) and there's no better one.
export function commonPlaceName(name: string | null): string | null {
  if (!name) return null;
  // Singapore's planning areas come as "Bayfront Subzone".
  const key = fold(name).replace(/ subzone$/, "");
  if (COMMON_NAMES[key]) return COMMON_NAMES[key];
  if (/^barangay \d+$/.test(key)) return null;
  return name.replace(/ Subzone$/i, "");
}

// Other names a place is known by, so search finds it either way.
const ALSO_KNOWN_AS: Record<string, string[]> = {
  "dubai marina": ["Marsa Dubai", "Marina"],
  difc: ["Dubai International Financial Centre", "Financial Centre", "Zaabeel"],
  "jumeirah lakes towers": ["JLT"],
  "jumeirah lake towers": ["JLT"],
  "jumeirah beach residence": ["JBR"],
  "downtown dubai": ["Downtown", "Burj Khalifa"],
  "marina bay": ["Bayfront", "MBS"],
  bgc: ["Bonifacio Global City", "Fort Bonifacio", "Taguig"],
  intramuros: ["Manila"],
};

// Metro Manila's cities all count as Manila for search.
const METRO_MANILA = new Set([
  "manila",
  "makati",
  "taguig",
  "pasig",
  "mandaluyong",
  "quezon city",
  "pasay",
  "san juan",
  "paranaque",
  "muntinlupa",
  "las pinas",
  "marikina",
  "caloocan",
  "valenzuela",
  "malabon",
  "navotas",
  "pateros",
]);

export function placeAliases(...names: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const name of names) {
    if (!name) continue;
    const key = fold(name);
    out.push(...(ALSO_KNOWN_AS[key] ?? []));
    if (METRO_MANILA.has(key)) out.push("Manila", "Metro Manila");
  }
  return [...new Set(out)];
}
