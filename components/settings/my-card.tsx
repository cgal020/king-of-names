"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Input } from "@/components/ui/input";
import { toVCard } from "@/lib/contacts/vcard";

type Me = { full_name: string; company: string; role: string; phone: string; email: string };

// Your own card as a QR code. The details sit inside the code, so it scans
// without internet, unlike most digital cards, which only hold a link.
export function MyCard({ initial }: { initial: Me }) {
  const [me, setMe] = useState(initial);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const card = toVCard({
      full_name: me.full_name || "Me",
      phone: me.phone || null,
      extras: { company: me.company || undefined, role: me.role || undefined, email: me.email || undefined },
      birthday_day: null,
      birthday_month: null,
      birthday_year: null,
      where_met_text: null,
      place_name: null,
      city: null,
      met_at: new Date().toISOString(),
      met_timezone: null,
      notes: null,
      tags: [],
    })
      // Your own card doesn't need a "met at" note.
      .replace(/^NOTE:.*\r\n/m, "");
    QRCode.toString(card, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then((s) => {
      if (!cancelled) setSvg(s);
    });
    return () => {
      cancelled = true;
    };
  }, [me]);

  const field = (key: keyof Me, label: string, type = "text") => (
    <label className="block">
      <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={me[key]}
        onChange={(e) => setMe((m) => ({ ...m, [key]: e.target.value }))}
        className="h-11 rounded-xl px-3.5"
      />
    </label>
  );

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
      <div className="mx-auto w-full max-w-[220px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
        {svg ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated SVG
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt="QR code with your contact card" className="aspect-square w-full" />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
        )}
      </div>
      <div className="grid gap-3">
        {field("full_name", "Name")}
        <div className="grid grid-cols-2 gap-2">
          {field("company", "Company")}
          {field("role", "Role")}
        </div>
        {field("phone", "Phone", "tel")}
        {field("email", "Email", "email")}
      </div>
    </div>
  );
}
