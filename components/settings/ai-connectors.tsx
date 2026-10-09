"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authConfigured } from "@/lib/auth/config";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
const origin = () => window.location.origin;

// Lets Claude and ChatGPT read the user's people through the MCP connector.
// Off until the user turns it on; each assistant still asks them to sign in.
export function AiConnectors() {
  const appOrigin = useSyncExternalStore(noSubscribe, origin, () => "");
  const [enabled, setEnabled] = useState(false);
  const url = `${appOrigin}/api/mcp`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Connector link copied");
    } catch {
      toast("Copy didn't work", { description: url });
    }
  }

  // With accounts, the connector waits for its secure sign-in (OAuth); until
  // then a switch here would do nothing.
  if (authConfigured()) {
    return (
      <p className="rounded-2xl bg-muted p-4 text-[0.95rem] text-muted-foreground">
        Coming soon: ask Claude or ChatGPT things like &ldquo;who do I know in Bangkok who could help with hotels?&rdquo;
        It will be read only and off until you turn it on.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start justify-between gap-4 rounded-2xl bg-muted p-4">
        <span>
          <span className="block font-medium">Let Claude and ChatGPT read my people</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Ask them things like &ldquo;who do I know in Bangkok who could help with hotels?&rdquo;
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((e) => !e)}
          className={cn(
            "relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors duration-150",
            enabled ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-background shadow-sm transition-transform duration-150",
              enabled && "translate-x-5",
            )}
          />
        </button>
      </label>

      {enabled && (
        <>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">Connector link</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl bg-muted px-3.5 py-3 font-mono text-sm">{url}</code>
              <Button variant="outline" size="icon-touch" aria-label="Copy connector link" onClick={copy}>
                <CopyIcon />
              </Button>
            </div>
          </div>

          <div className="divide-y border-y">
            <Steps
              title="Claude"
              steps={[
                "In Claude, open Settings, then Connectors.",
                "Choose “Add custom connector”.",
                `Name it ${appConfig.name} and paste the connector link.`,
                `Select Connect, sign in with your ${appConfig.name} account and approve.`,
              ]}
            />
            <Steps
              title="ChatGPT"
              steps={[
                "In ChatGPT on the web, open Settings, then Apps.",
                "Under Advanced settings, turn on Developer mode (Plus, Pro, Business, Enterprise and Edu plans).",
                `Choose Create, name it ${appConfig.name}, paste the connector link and pick OAuth.`,
                `Sign in with your ${appConfig.name} account and approve.`,
              ]}
            />
          </div>

          <ul className="list-disc space-y-1 pl-5 text-[0.95rem] text-muted-foreground marker:text-primary">
            <li>Read only: assistants can search and read your people, never change or delete them.</li>
            <li>
              When you ask a question, the people needed to answer it are sent to Anthropic or OpenAI under your own
              account with them.
            </li>
            <li>Turn this off or disconnect an assistant here at any time.</li>
          </ul>

          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">Connected assistants</p>
            <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
              None yet. They appear here after you sign in from Claude or ChatGPT.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Preview: the connector answers with sample data on this development server (try it from Claude Code).
            Claude.ai and ChatGPT can connect once the app is live with sign-in.
          </p>
        </>
      )}
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <details className="group">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
        Connect {title}
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ol className="list-decimal space-y-1.5 pb-4 pl-5 text-[0.95rem] leading-relaxed marker:text-muted-foreground">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </details>
  );
}
