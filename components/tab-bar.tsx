"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { MapIcon, MicIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/capture", label: "Capture", icon: MicIcon },
  { href: "/people", label: "People", icon: UsersIcon },
  { href: "/ask", label: "Ask", icon: SparklesIcon },
  { href: "/map", label: "Map", icon: MapIcon },
] as const;

// Screens with their own action bar, where the tab bar would only stack on
// top of it: Review (and the same form for adding and editing), the card
// scanner and Event Mode review.
const HIDDEN_ON = [/^\/capture\/(review|card|event)/, /^\/people\/new/, /^\/people\/[^/]+\/edit/];

// Capture hides the bar while recording, so nothing competes with Stop.
let recording = false;
const listeners = new Set<() => void>();
export function setRecordingChrome(on: boolean) {
  recording = on;
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function TabBar() {
  const pathname = usePathname();
  const isRecording = useSyncExternalStore(subscribe, () => recording, () => false);
  const hidden = isRecording || HIDDEN_ON.some((route) => route.test(pathname));

  // The page's bottom padding and the action bars follow --tabbar-h.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-tabbar-hidden", hidden);
  }, [hidden]);

  return (
    <nav
      aria-label="Main"
      hidden={hidden}
      className="fixed inset-x-0 bottom-0 z-30 h-(--tabbar-h) border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-backdrop-filter:bg-background/85"
    >
      <ul className="mx-auto grid h-full max-w-xl grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-[3px] rounded-[10px] text-[0.6875rem] leading-[1.2] font-semibold tracking-[0.02em] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2 : 1.8} aria-hidden />
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
