import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

// The crown, from the wordmark and the app icon.
export function Crown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={cn("h-[15px] w-[22px] shrink-0", className)}
      aria-hidden
    >
      <path d="M2 18 L4 5 L10 11 L15 2 L20 11 L26 5 L28 18 Z" />
    </svg>
  );
}

// "KING OF NAMES" beside the crown, never larger than a section label so the
// app stays discreet. Deep green by day, gold by night.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-xs leading-4 font-medium tracking-[0.3em] text-brand-ink uppercase dark:text-brand-gold",
        className,
      )}
    >
      <Crown />
      {appConfig.name}
    </span>
  );
}
