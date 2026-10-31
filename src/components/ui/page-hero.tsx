import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The soft gradient banner that opens a feature page: icon, title, one line of help, optional actions. */
export function PageHero({
  icon: Icon,
  title,
  subtitle,
  status,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** A small live indicator drawn on the icon, such as an "online" dot. */
  status?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-soft via-surface to-surface p-4 sm:p-5",
        className,
      )}
    >
      {/* Decorative glow. Clipped by the banner, so it can never widen the page. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex items-center gap-3.5">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] text-primary-foreground shadow-md">
          <Icon className="size-6" aria-hidden />
          {status && (
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-success" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
