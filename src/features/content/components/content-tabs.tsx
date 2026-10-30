"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/teacher/content/courses", key: "courses" },
  { href: "/teacher/content/materials", key: "materials" },
] as const;

export function ContentTabs() {
  const t = useTranslations("content.tabs");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex gap-2">
      {tabs.map(({ href, key }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
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
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
