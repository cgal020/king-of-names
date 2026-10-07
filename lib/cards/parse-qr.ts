// Turns the text inside a business-card QR code into profile fields.
// Handles vCard 2.1/3.0/4.0, MECARD, links (digital cards, LinkedIn,
// WhatsApp), tel:, mailto: and plain text. Never fetches anything.

export type CardDetails = {
  full_name: string | null;
  company: string | null;
  role: string | null;
  phones: string[];
  emails: string[];
  websites: string[];
  linkedin: string | null;
  // A LINE profile link (line.me/ti/p/...), common in Thailand.
  line: string | null;
  // A hosted digital card (Blinq, Popl, HiHello...). These QR codes hold only
  // a link, so the details have to come from a photo of the card.
  digitalCard: { service: string; url: string } | null;
  address: string | null;
  notes: string | null;
  birthday: { day: number | null; month: number; year: number | null } | null;
};

// Digital business card services whose QR codes are profile links by default
// (checked October 2026, docs/research/notes/gap_new_features.md).
const DIGITAL_CARD_HOSTS: Record<string, string> = {
  "blinq.me": "Blinq",
  "popl.co": "Popl",
  "hihello.me": "HiHello",
  "hihello.com": "HiHello",
  "linqapp.com": "Linq",
  "wavecnct.com": "Wave",
  "v1ce.co": "V1CE",
  "tapt.io": "Tapt",
  "mobilocard.com": "Mobilo",
  "thehaystackapp.com": "Haystack",
};

function digitalCardService(host: string) {
  const match = Object.keys(DIGITAL_CARD_HOSTS).find((h) => host === h || host.endsWith(`.${h}`));
  return match ? DIGITAL_CARD_HOSTS[match] : null;
}

export type QrResult = {
  kind: "vcard" | "mecard" | "link" | "phone" | "email" | "text";
  details: CardDetails;
};

const empty = (): CardDetails => ({
  full_name: null,
  company: null,
  role: null,
  phones: [],
  emails: [],
  websites: [],
  linkedin: null,
  line: null,
  digitalCard: null,
  address: null,
  notes: null,
  birthday: null,
});

export function parseQr(raw: string): QrResult {
  const text = raw.trim();
  if (/^BEGIN:VCARD/i.test(text)) return { kind: "vcard", details: parseVcard(text) };
  if (/^MECARD:/i.test(text)) return { kind: "mecard", details: parseMecard(text) };

  const details = empty();
  if (/^tel:/i.test(text)) {
    details.phones.push(normalizePhone(text.slice(4)));
    return { kind: "phone", details };
  }
  if (/^mailto:/i.test(text)) {
    details.emails.push(decodeURIComponent(text.slice(7).split("?")[0]));
    return { kind: "email", details };
  }
  if (/^https?:\/\//i.test(text)) {
    addUrl(details, text);
    return { kind: "link", details };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    details.emails.push(text);
    return { kind: "email", details };
  }
  if (/^\+?[\d\s().-]{7,}$/.test(text)) {
    details.phones.push(normalizePhone(text));
    return { kind: "phone", details };
  }
  details.notes = text;
  return { kind: "text", details };
}

// Keep digits and a leading plus; never guess a country code.
export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function addUrl(details: CardDetails, url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const service = digitalCardService(host);
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    details.linkedin ??= url;
  } else if (host === "wa.me" && /^\/\d{7,}/.test(parsed.pathname)) {
    details.phones.push(`+${parsed.pathname.slice(1).replace(/\D/g, "")}`);
  } else if (host === "line.me" && parsed.pathname.startsWith("/ti/p/")) {
    details.line ??= url;
  } else if (service) {
    details.digitalCard ??= { service, url };
  } else if (!details.websites.includes(url)) {
    details.websites.push(url);
  }
}

function parseVcard(text: string): CardDetails {
  const details = empty();
  // Unfold continuation lines (RFC 6350 3.2) and quoted-printable soft breaks.
  const lines = text
    .replace(/=\r?\n/g, "")
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/);

  let structuredName: string | null = null;
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const [nameWithGroup, ...params] = line.slice(0, colon).split(";");
    const name = nameWithGroup.split(".").pop()!.toUpperCase();
    const paramText = params.join(";").toUpperCase();
    let value = line.slice(colon + 1);
    if (paramText.includes("QUOTED-PRINTABLE")) value = decodeQuotedPrintable(value);

    switch (name) {
      case "FN":
        details.full_name = unescape(value).trim() || details.full_name;
        break;
      case "N":
        structuredName = value;
        break;
      case "ORG":
        details.company = unescape(splitUnescaped(value, ";")[0]).trim() || null;
        break;
      case "TITLE":
        details.role = unescape(value).trim() || null;
        break;
      case "ROLE":
        details.role ??= unescape(value).trim() || null;
        break;
      case "TEL": {
        const phone = normalizePhone(value.replace(/^tel:/i, ""));
        if (phone && !details.phones.includes(phone)) details.phones.push(phone);
        break;
      }
      case "EMAIL": {
        const email = unescape(value).trim();
        if (email && !details.emails.includes(email)) details.emails.push(email);
        break;
      }
      case "URL":
        addUrl(details, unescape(value).trim());
        break;
      case "X-SOCIALPROFILE":
        if (/linkedin/i.test(paramText) || /linkedin\.com/i.test(value)) details.linkedin ??= unescape(value).trim();
        break;
      case "ADR":
        details.address =
          splitUnescaped(value, ";")
            .map((part) => unescape(part).trim())
            .filter(Boolean)
            .join(", ") || null;
        break;
      case "NOTE":
        details.notes = unescape(value).trim() || null;
        break;
      case "BDAY":
        details.birthday = parseBirthday(value);
        break;
    }
  }

  if (!details.full_name && structuredName) {
    // N is "Family;Given;Additional;Prefix;Suffix".
    const [family, given, additional] = splitUnescaped(structuredName, ";").map((p) => unescape(p).trim());
    details.full_name = [given, additional, family].filter(Boolean).join(" ") || null;
  }
  return details;
}

function parseMecard(text: string): CardDetails {
  const details = empty();
  const body = text.replace(/^MECARD:/i, "").replace(/;;\s*$/, "");
  for (const field of splitUnescaped(body, ";")) {
    const colon = field.indexOf(":");
    if (colon < 0) continue;
    const key = field.slice(0, colon).toUpperCase();
    const value = unescape(field.slice(colon + 1)).trim();
    if (!value) continue;
    if (key === "N") {
      // "Family,Given"
      const [family, given] = value.split(",").map((p) => p.trim());
      details.full_name = [given, family].filter(Boolean).join(" ");
    } else if (key === "TEL") details.phones.push(normalizePhone(value));
    else if (key === "EMAIL") details.emails.push(value);
    else if (key === "URL") addUrl(details, value);
    else if (key === "ORG") details.company = value;
    else if (key === "ADR") details.address = value;
    else if (key === "NOTE") details.notes = value;
    else if (key === "BDAY") details.birthday = parseBirthday(value);
  }
  return details;
}

// "1979-07-02", "19790702", "--0702" or "--07-02" (no year).
function parseBirthday(value: string) {
  const v = value.trim();
  const full = v.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (full) return checkDate(Number(full[3]), Number(full[2]), Number(full[1]));
  const noYear = v.match(/^--(\d{2})-?(\d{2})/);
  if (noYear) return checkDate(Number(noYear[2]), Number(noYear[1]), null);
  return null;
}

function checkDate(day: number, month: number, year: number | null) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

// Splits on a separator that isn't escaped with a backslash.
function splitUnescaped(value: string, separator: string) {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "\\" && i + 1 < value.length) {
      current += value[i] + value[i + 1];
      i++;
    } else if (value[i] === separator) {
      parts.push(current);
      current = "";
    } else {
      current += value[i];
    }
  }
  parts.push(current);
  return parts;
}

function unescape(value: string) {
  return value.replace(/\\([nN,;:\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

function decodeQuotedPrintable(value: string) {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "=" && /^[0-9A-F]{2}$/i.test(value.slice(i + 1, i + 3))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(value.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
