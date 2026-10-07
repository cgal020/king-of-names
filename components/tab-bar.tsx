"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapIcon, MicIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/capture", label: "Capture", icon: MicIcon },
  { href: "/people", label: "People", icon: UsersIcon },
  { href: "/ask", label: "Ask", icon: SparklesIcon },
  { href: "/map", label: "Map", icon: MapIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 h-(--tabbar-h) border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-backdrop-filter:bg-background/80"
    >
      <ul className="mx-auto grid h-15 max-w-xl grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-[1.375rem]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
