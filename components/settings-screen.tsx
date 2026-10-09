"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, CopyIcon } from "lucide-react";
import { AccountActions } from "@/components/settings/account-actions";
import { AiConnectors } from "@/components/settings/ai-connectors";
import { ExportButtons } from "@/components/settings/export-buttons";
import { ImportContacts } from "@/components/settings/import-contacts";
import { MyCard } from "@/components/settings/my-card";
import { Button } from "@/components/ui/button";
import { createInvite } from "@/app/actions/settings";
import { appConfig } from "@/lib/config";
import type { Account, Invite } from "@/lib/data/account";
import { formatShortDate } from "@/lib/format";
import { knownTags } from "@/lib/tags";
import type { Person } from "@/lib/types";

export function SettingsScreen({ account, invites, people }: { account: Account; invites: Invite[]; people: Person[] }) {
  const [codes, setCodes] = useState(invites);
  const [making, setMaking] = useState(false);
  // Tags in use with how many people carry each.
  const tagCounts = knownTags(people)
    .map((tag) => ({ tag, count: people.filter((p) => p.tags.includes(tag)).length }))
    .filter((t) => t.count > 0);

  async function newCode() {
    setMaking(true);
    const result = await createInvite().catch(() => ({ ok: false as const, error: "Couldn’t make a code. Try again." }));
    setMaking(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCodes((list) => [{ code: result.code, usedBy: null, usedAt: null }, ...list]);
    void copy(result.code);
  }

  // Copies a link that opens sign-up with the code filled in.
  async function copy(code: string) {
    const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied", { description: "It opens sign-up with the code filled in." });
    } catch {
      toast("Copy didn't work", { description: link });
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <Section title="Account">
        <dl className="divide-y border-y">
          <Row label="Username" value={account.username} />
          {account.displayName && <Row label="Name" value={account.displayName} />}
          {account.email && <Row label="Email" value={account.email} />}
        </dl>
      </Section>

      <Section
        title="My card"
        description="Let people scan you. Your details sit inside the code, so it works without internet."
      >
        <MyCard
          initial={{
            full_name: account.displayName ?? "",
            company: "",
            role: "",
            phone: "",
            email: account.email ?? "",
          }}
        />
      </Section>

      <Section
        title="Import contacts"
        description="Start with people you already know. You'll see a preview before anything is added."
      >
        <ImportContacts />
      </Section>

      <Section
        title="Claude and ChatGPT"
        description="Connect your people to the AI assistant you already use."
      >
        <AiConnectors />
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
                  {c.usedBy ? `Used by @${c.usedBy}${c.usedAt ? `, ${formatShortDate(c.usedAt.slice(0, 10))}` : ""}` : "Not used yet"}
                </span>
              </span>
              {!c.usedBy && (
                <Button
                  variant="ghost"
                  size="icon-touch"
                  aria-label={`Copy invite link for ${c.code}`}
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
          disabled={making}
          onClick={() => void newCode()}
        >
          {making ? "Making a code…" : "New invite code"}
        </Button>
      </Section>

      <Section
        title="Tags"
        description="How people could help you. The AI suggests tags from your notes; you can add your own on any profile."
      >
        <ul className="flex flex-wrap gap-2">
          {tagCounts.map(({ tag, count }) => (
            <li
              key={tag}
              className="flex h-9 items-center gap-2 rounded-full bg-primary/10 px-3.5 text-sm font-medium text-primary"
            >
              {tag}
              <span className="text-primary/70 tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">Renaming and merging tags comes with the full build.</p>
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
        <ExportButtons />
      </Section>

      <Section title="Privacy">
        <div className="max-w-[65ch] space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          <p>
            {appConfig.name} stores the people you add, your voice notes, their transcripts, and where and
            when each note was recorded. It is kept in a private database in Mumbai, India, that only your account
            can read.
          </p>
          <p>
            To fill in a profile, the recording is sent to OpenAI to be transcribed, the transcript is sent to
            Anthropic to pick out names and details, and the location is sent to Mapbox to find the place name.
          </p>
          <p>
            Photos are stored the same way. Photos of business cards are sent to Anthropic to read the details off
            the card; other photos, including photos of people, are never sent to an AI. When you use Ask AI, your
            question and the notes needed to answer it are sent to Anthropic. Nothing else about you is sent to
            these providers.
          </p>
          <p>You can export everything or delete your account at any time.</p>
          <ul className="list-disc space-y-1 pl-5 text-foreground marker:text-primary">
            <li>Your notes are never used to train AI.</li>
            <li>No enrichment: we never look people up on LinkedIn, the web or data brokers.</li>
            <li>No face recognition, ever.</li>
            <li>Only you can see your people. Invited accounts are completely separate.</li>
          </ul>
        </div>
      </Section>

      <AccountActions />
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
      <h2 className="type-section">{title}</h2>
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
