"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

const SAMPLE_CODES = [
  { code: "M4QK-7XRT-9PWD", usedBy: "sarah_k", usedAt: "12 Sep 2026" },
  { code: "H2NB-5CJV-3TQE", usedBy: null, usedAt: null },
];

function randomCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  return [0, 1, 2].map(() => Array.from({ length: 4 }, pick).join("")).join("-");
}

export function SettingsScreen() {
  const router = useRouter();
  const [codes, setCodes] = useState(SAMPLE_CODES);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied");
    } catch {
      toast("Copy didn't work", { description: code });
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <Section title="Account">
        <dl className="divide-y border-y">
          <Row label="Username" value="cameron" />
          <Row label="Name" value="Cameron Gallagher" />
          <Row label="Email" value="cameron@example.com" />
        </dl>
      </Section>

      <Section
        title="Invite someone"
        description="Each code creates one private account. They never see your people."
      >
        <ul className="divide-y border-y">
          {codes.map((c) => (
            <li key={c.code} className="flex min-h-14 items-center justify-between gap-3 py-2">
              <span>
                <span className="block font-mono text-[0.95rem] tracking-wide">{c.code}</span>
                <span className="block text-sm text-muted-foreground">
                  {c.usedBy ? `Used by @${c.usedBy}, ${c.usedAt}` : "Not used yet"}
                </span>
              </span>
              {!c.usedBy && (
                <Button
                  variant="ghost"
                  size="icon-touch"
                  aria-label={`Copy ${c.code}`}
                  onClick={() => copy(c.code)}
                  className="-mr-2 text-primary"
                >
                  <CopyIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="touch-lg"
          className="mt-4 w-full"
          onClick={() => {
            const code = randomCode();
            setCodes((list) => [{ code, usedBy: null, usedAt: null }, ...list]);
            void copy(code);
          }}
        >
          New invite code
        </Button>
      </Section>

      <Section title="Install on your phone">
        <div className="divide-y border-y">
          <Steps
            title="iPhone"
            steps={[
              "Open this page in Safari.",
              "Tap the Share button at the bottom of the screen.",
              "Scroll down and tap “Add to Home Screen”, then “Add”.",
              `Open ${appConfig.name} from your home screen from now on.`,
            ]}
          />
          <Steps
            title="Android"
            steps={[
              "Open this page in Chrome.",
              "Tap the three-dot menu at the top right.",
              "Tap “Add to Home screen” or “Install app”, then confirm.",
              `Open ${appConfig.name} from your home screen from now on.`,
            ]}
          />
        </div>
      </Section>

      <Section title="Your data">
        <div className="grid grid-cols-2 gap-3">
          {["CSV", "JSON"].map((format) => (
            <Button
              key={format}
              variant="outline"
              size="touch-lg"
              onClick={() => toast(`Export as ${format}`, { description: "Preview only. No file is made yet." })}
            >
              <DownloadIcon aria-hidden />
              Export {format}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Privacy">
        <div className="max-w-[65ch] space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          <p>
            {appConfig.name} stores the people you add, your voice notes, their transcripts, and where and
            when each note was recorded. It is kept in a private database in Singapore that only your account
            can read.
          </p>
          <p>
            To fill in a profile, the recording is sent to OpenAI to be transcribed, the transcript is sent to
            Anthropic to pick out names and details, and the location is sent to Mapbox to find the place name.
            Nothing else about you is sent to them.
          </p>
          <p>You can export everything or delete your account at any time.</p>
        </div>
      </Section>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="touch-lg"
          className="w-full"
          onClick={() => toast("Signed out", { description: "Preview only." })}
        >
          Sign out
        </Button>
        <ConfirmButton
          label="Delete my account"
          title="Delete your account?"
          description="Every person, note and recording will be permanently deleted. Export first if you want a copy."
          confirmLabel="Delete everything"
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onConfirm={() => {
            toast("Account deleted", { description: "Preview only. Nothing was removed." });
            router.push("/capture");
          }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-[0.95rem] text-muted-foreground">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2">
      <dt className="text-[0.95rem] text-muted-foreground">{label}</dt>
      <dd className="truncate text-[0.95rem]">{value}</dd>
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <details className="group">
      <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-[1.0625rem] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ol className="list-decimal space-y-2 pb-4 pl-5 text-[0.95rem] leading-relaxed marker:text-muted-foreground">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </details>
  );
}
