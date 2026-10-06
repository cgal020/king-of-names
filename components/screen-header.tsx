import Link from "next/link";
import { ChevronLeftIcon, SettingsIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScreenHeaderProps = {
  title?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  showSettings?: boolean;
  className?: string;
};

export function ScreenHeader({ title, back, actions, showSettings = true, className }: ScreenHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-h-14 items-center justify-between gap-2 pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="flex min-w-0 items-center">
        {back ? (
          <Link
            href={back.href}
            className="-ml-2 flex h-11 items-center gap-0.5 rounded-xl pr-3 pl-1 text-[0.95rem] font-medium text-primary"
          >
            <ChevronLeftIcon className="size-5" aria-hidden />
            {back.label}
          </Link>
        ) : (
          title && <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-1">
        {actions}
        {showSettings && (
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "-mr-2 text-muted-foreground")}
          >
            <SettingsIcon />
          </Link>
        )}
      </div>
    </header>
  );
}
