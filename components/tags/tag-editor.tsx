"use client";

import { useState } from "react";
import { PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import { addTag, RELATIONSHIPS, removeTag, type Relationship } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagEditorProps = {
  relationship: Relationship | null;
  tags: string[];
  // Tags to offer, most useful first (the user's own, then the starters).
  suggestions: string[];
  // True when the AI picked the current values and the user hasn't changed them.
  aiSuggested?: boolean;
  onChange: (next: { relationship: Relationship | null; tags: string[] }) => void;
};

export function TagEditor({ relationship, tags, suggestions, aiSuggested, onChange }: TagEditorProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const offered = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 5);

  function commitDraft() {
    if (draft.trim()) onChange({ relationship, tags: addTag(tags, draft) });
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 flex items-center text-sm font-medium text-muted-foreground">
          Relationship
          {aiSuggested && relationship && <AiBadge />}
        </legend>
        <div role="radiogroup" aria-label="Relationship" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {RELATIONSHIPS.map((r) => {
            const selected = relationship === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                // Tapping the selected option again clears it.
                onClick={() => onChange({ relationship: selected ? null : r.value, tags })}
                className={cn(
                  "h-10 rounded-lg text-[0.95rem] font-medium transition-colors duration-150",
                  selected ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 flex items-center text-sm font-medium text-muted-foreground">
          How they could help
          {aiSuggested && tags.length > 0 && <AiBadge />}
        </legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex h-9 items-center gap-1 rounded-full bg-primary/10 pr-1 pl-3.5 text-sm font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange({ relationship, tags: removeTag(tags, tag) })}
                aria-label={`Remove ${tag}`}
                className="grid size-7 place-items-center rounded-full hover:bg-primary/15"
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}

          {offered.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange({ relationship, tags: addTag(tags, tag) })}
              className="flex h-9 items-center gap-1 rounded-full border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusIcon className="size-3.5" aria-hidden />
              {tag}
            </button>
          ))}

          {adding ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraft();
                } else if (e.key === "Escape") {
                  setDraft("");
                  setAdding(false);
                }
              }}
              enterKeyHint="done"
              aria-label="New tag"
              placeholder="New tag"
              className="h-9 w-36 rounded-full border border-primary/50 bg-background px-3.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-9 items-center gap-1 rounded-full border border-dashed px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusIcon className="size-3.5" aria-hidden />
              New tag
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}

function AiBadge() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
      <SparklesIcon className="size-3" aria-hidden />
      Suggested
    </span>
  );
}

// Read-only display for profiles and cards.
export function TagList({
  relationship,
  tags,
  className,
}: {
  relationship: Relationship | null;
  tags: string[];
  className?: string;
}) {
  if (!relationship && tags.length === 0) return null;
  const label = RELATIONSHIPS.find((r) => r.value === relationship)?.label;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Tags">
      {label && (
        <li className="flex h-7 items-center rounded-full border px-2.5 text-[0.8rem] font-medium text-muted-foreground">
          {label}
        </li>
      )}
      {tags.map((tag) => (
        <li key={tag} className="flex h-7 items-center rounded-full bg-primary/10 px-2.5 text-[0.8rem] font-medium text-primary">
          {tag}
        </li>
      ))}
    </ul>
  );
}
