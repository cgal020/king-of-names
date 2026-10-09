// Ways to message someone from their profile. WhatsApp needs the number with
// its country code; we never guess one, since a wrong guess messages a
// stranger. LINE needs their LINE profile link.

export function whatsappLink(phone: string | null | undefined): string | null {
  const text = (phone ?? "").trim();
  if (!text.startsWith("+") && !text.startsWith("00")) return null;
  const digits = text.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export function lineLink(line: string | null | undefined): string | null {
  try {
    const url = new URL((line ?? "").trim());
    return url.protocol === "https:" && (url.hostname === "line.me" || url.hostname.endsWith(".line.me")) ? url.toString() : null;
  } catch {
    return null;
  }
}
