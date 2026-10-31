"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Practice / Scheduled switch shown above the two test lists.
 * Teachers: `base` is "/teacher/tests" and practice lives at `base` itself.
 * Students: `base` is "/tests" (a chooser page) and practice lives at "/tests/practice".
 * It hides itself inside a test so the runner and editors have the whole screen.
 */
export function TestsTabs({
  base,
  practiceHref = base,
}: {
  base: "/teacher/tests" | "/tests";
  practiceHref?: string;
}) {
  const t = useTranslations("scheduled.tabs");
  const pathname = usePathname();

  const scheduledHref = `${base}/scheduled`;
  const onTopLevel = pathname === practiceHref || pathname === scheduledHref;
  if (!onTopLevel) return null;

  const tabs = [
    { href: practiceHref, label: t("practice"), active: pathname === practiceHref },
    { href: scheduledHref, label: t("scheduled"), active: pathname === scheduledHref },
  ];

  return (
    <nav aria-label={t("label")} className="flex gap-2">
      {tabs.map(({ href, label, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
            active
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
