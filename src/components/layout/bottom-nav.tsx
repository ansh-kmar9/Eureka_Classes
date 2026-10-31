"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navIcons, type NavItem } from "./icons";
import { getActiveHref } from "./nav-utils";

/** Fixed bottom bar for mobile. Shared by the public, student and staff layouts. */
export function BottomNav({
  items,
  label,
  className,
}: {
  items: NavItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname, items);

  return (
    <nav
      aria-label={label}
      className={cn(
        "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const Icon = navIcons[item.icon];
          const active = item.href === activeHref;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-end gap-0.5 px-0.5 pb-2 pt-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.featured ? (
                  // A round button that rises above the bar; the ring matches the bar so it looks cut out of it.
                  <span
                    className={cn(
                      "-mt-6 flex size-12 items-center justify-center rounded-full border-4 border-surface shadow-md transition-colors",
                      active
                        ? "bg-gradient-to-br from-primary to-[#a855f7] text-primary-foreground"
                        : "bg-primary-soft text-primary",
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
                <span className="max-w-full break-words text-center leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
