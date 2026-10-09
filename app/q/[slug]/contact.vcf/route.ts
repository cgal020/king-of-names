// The contact card behind a contact QR code, as a vCard the phone offers to
// save. Public, like the page that links to it.
import { findQrBySlug } from "@/lib/data/qr";

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = await findQrBySlug(slug);
  if (!code || code.destination.purpose !== "contact") return new Response("Not found", { status: 404 });
  const d = code.destination;
  const [first, ...rest] = d.full_name.split(/\s+/);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escape(d.full_name)}`,
    `N:${escape(rest.join(" "))};${escape(first)};;;`,
    d.company && `ORG:${escape(d.company)}`,
    d.role && `TITLE:${escape(d.role)}`,
    d.phone && `TEL;TYPE=CELL:${escape(d.phone)}`,
    d.email && `EMAIL;TYPE=INTERNET:${escape(d.email)}`,
    d.website && `URL:${escape(d.website)}`,
    "END:VCARD",
  ].filter(Boolean);
  const file = d.full_name.replace(/[^\p{L}\p{N} ]/gu, "").trim().replace(/\s+/g, "-") || "contact";
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${file}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
