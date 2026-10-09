"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteQr, saveQr } from "@/app/actions/qr";
import { ConfirmButton } from "@/components/confirm-button";
import { DesignedQr, PurposeMark } from "@/components/qr/designed-qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShortDate } from "@/lib/format";
import { PURPOSE_META, QR_PURPOSES, qrUrl, type QrCode, type QrPurpose } from "@/lib/qr/codes";
import { cn } from "@/lib/utils";

type Fields = Record<string, string>;

// The fields each purpose asks for, in order.
// Web addresses are plain text with the URL keyboard: a url input would make
// the browser refuse "example.com/menu", which the app completes itself.
type Field = { key: string; label: string; placeholder?: string; type?: string; inputMode?: "url" | "tel" | "email"; required?: boolean };
const FIELDS: Record<QrPurpose, Field[]> = {
  contact: [
    { key: "full_name", label: "Name", required: true },
    { key: "role", label: "Role" },
    { key: "company", label: "Company" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+971 55 555 0142" },
    { key: "email", label: "Email", type: "email" },
    { key: "website", label: "Website", placeholder: "example.com", inputMode: "url" },
  ],
  whatsapp: [
    { key: "phone", label: "Your WhatsApp number", type: "tel", placeholder: "+971 55 555 0142", required: true },
    { key: "message", label: "First message, filled in for them", placeholder: "Hi Cameron, we met at…" },
  ],
  linkedin: [{ key: "url", label: "Your LinkedIn profile", placeholder: "linkedin.com/in/your-name", inputMode: "url", required: true }],
  instagram: [{ key: "handle", label: "Your Instagram name", placeholder: "@yourname", required: true }],
  link: [{ key: "url", label: "Web address", placeholder: "example.com/menu", inputMode: "url", required: true }],
};

const noSubscribe = () => () => {};
const siteOrigin = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

function fieldsFrom(code: QrCode | null): Fields {
  if (!code) return {};
  const d = code.destination;
  switch (d.purpose) {
    case "whatsapp":
      return { phone: `+${d.phone}`, message: d.message ?? "" };
    case "instagram":
      return { handle: `@${d.handle}` };
    default:
      return Object.fromEntries(Object.entries(d).filter(([k, v]) => k !== "purpose" && typeof v === "string")) as Fields;
  }
}

export function QrEditor({ code, me }: { code: QrCode | null; me: { name: string; email: string } }) {
  const router = useRouter();
  const origin = useSyncExternalStore(noSubscribe, siteOrigin, () => null);
  const [purpose, setPurpose] = useState<QrPurpose>(code?.destination.purpose ?? "contact");
  const [fields, setFields] = useState<Fields>(() => (code ? fieldsFrom(code) : { full_name: me.name, email: me.email }));
  const [label, setLabel] = useState(code?.label ?? PURPOSE_META.contact.defaultLabel);
  // A label still at its purpose's default follows the purpose when it changes.
  const [labelTouched, setLabelTouched] = useState(Boolean(code && code.label !== PURPOSE_META[code.destination.purpose].defaultLabel));
  const [saving, setSaving] = useState(false);

  function choose(next: QrPurpose) {
    setPurpose(next);
    if (!labelTouched) setLabel(PURPOSE_META[next].defaultLabel);
  }

  async function save() {
    setSaving(true);
    const destination = { purpose, ...Object.fromEntries(FIELDS[purpose].map((f) => [f.key, fields[f.key] ?? ""])) };
    const result = await saveQr(code?.id ?? null, { label, destination }).catch(() => ({ ok: false as const, error: "That didn’t save. Try again." }));
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(code ? "Code updated" : "QR code made", {
      description: result.preview ? "Preview only. Nothing was stored." : code ? "The printed code now goes to the new place." : undefined,
    });
    router.push("/qr");
  }

  const ready = FIELDS[purpose].every((f) => !f.required || (fields[f.key] ?? "").trim()) && label.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="pb-28"
    >
      <fieldset>
        <legend className="type-section mb-2">What it opens</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QR_PURPOSES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={purpose === p}
              onClick={() => choose(p)}
              className={cn(
                "flex min-h-14 items-center gap-2.5 rounded-2xl border px-3 text-left text-[0.9375rem] transition-colors",
                purpose === p ? "border-primary bg-accent font-medium text-accent-foreground" : "border-border hover:bg-muted",
              )}
            >
              <PurposeMark purpose={p} />
              {PURPOSE_META[p].name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{PURPOSE_META[purpose].hint}</p>
      </fieldset>

      <div className="mt-6 space-y-4">
        {FIELDS[purpose].map((f) => (
          <div key={f.key}>
            <label htmlFor={`qr-${f.key}`} className="mb-1.5 block text-sm font-medium">
              {f.label}
            </label>
            <Input
              id={`qr-${f.key}`}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              autoCapitalize={f.inputMode === "url" ? "none" : undefined}
              value={fields[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setFields((v) => ({ ...v, [f.key]: e.target.value }))}
              autoComplete="off"
            />
          </div>
        ))}
        <div>
          <label htmlFor="qr-label" className="mb-1.5 block text-sm font-medium">
            Words under the code
          </label>
          <Input
            id="qr-label"
            value={label}
            maxLength={40}
            onChange={(e) => {
              setLabel(e.target.value);
              setLabelTouched(true);
            }}
          />
        </div>
      </div>

      <section className="mt-8 flex flex-col items-center rounded-3xl bg-muted px-4 py-6">
        <div className="rounded-[24px] bg-[#fffaf0] p-3 shadow-card">
          {origin && <DesignedQr value={qrUrl(origin, code?.slug ?? "preview0")} purpose={purpose} size={200} />}
        </div>
        <p className="type-sheet-title mt-4 text-center">{label || PURPOSE_META[purpose].defaultLabel}</p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {code
            ? `Scanned ${code.scanCount === 1 ? "once" : `${code.scanCount} times`}${code.lastScannedAt ? `, last on ${formatShortDate(code.lastScannedAt.slice(0, 10))}` : ""}. Changes apply to the printed code too.`
            : "The pattern is final once you save."}
        </p>
      </section>

      {code && (
        <div className="mt-6">
          <ConfirmButton
            label="Delete this code"
            title="Delete this QR code?"
            description="Anyone who scans it, printed or on screen, will see that it no longer works."
            confirmLabel="Delete"
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onConfirm={async () => {
              const result = await deleteQr(code.id).catch(() => ({ ok: false, error: "That didn’t delete." }));
              if (!result.ok) return void toast.error(result.error ?? "That didn’t delete.");
              toast("Code deleted");
              router.push("/settings#qr");
            }}
          />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-(--tabbar-h) z-20 border-t bg-background/95 pb-(--bar-pad) backdrop-blur-md">
        <div className="mx-auto flex max-w-xl gap-3 px-5 py-3">
          <Button type="button" variant="outline" size="touch-lg" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="touch-lg" className="flex-[2]" disabled={!ready || saving} aria-busy={saving}>
            {saving ? "Saving…" : code ? "Save changes" : "Make the code"}
          </Button>
        </div>
      </div>
    </form>
  );
}
