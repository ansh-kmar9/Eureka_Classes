"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Announcement } from "@/lib/supabase/types";
import { markAnnouncementsSeen } from "../actions";

const REFRESH_AFTER_MS = 60_000;

/**
 * Header bell for students. A red badge counts announcements they have not opened yet;
 * tapping the bell lists them and clears the badge.
 */
export function AnnouncementsBell({
  items,
  seenAt,
}: {
  items: Announcement[];
  seenAt: string | null;
}) {
  const t = useTranslations("announcements");
  const format = useFormatter();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Set when the list is opened; everything newer than this is shown as "New".
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const [highlightSince, setHighlightSince] = useState<string | null>(null);
  const lastRefresh = useRef(0);

  const readUntil = [seenAt, clearedAt].filter(Boolean).sort().at(-1) ?? null;
  const isNew = (item: Announcement, since: string | null) =>
    since === null || item.created_at > since;
  const unread = items.filter((item) => isNew(item, readUntil)).length;

  // Layouts are not re-rendered on in-app navigation, so pick up new announcements
  // whenever the student returns to the app.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh.current < REFRESH_AFTER_MS) return;
      lastRefresh.current = Date.now();
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;

    setHighlightSince(readUntil);
    if (unread > 0) {
      setClearedAt(new Date().toISOString());
      void markAnnouncementsSeen();
    }
  };

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={unread > 0 ? t("openUnread", { count: unread }) : t("open")}
        onClick={() => handleOpenChange(true)}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white"
          >
            {badge}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent title={t("title")} closeLabel={t("close")}>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-card border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{item.title}</h3>
                    {isNew(item, highlightSince) && <Badge tone="primary">{t("new")}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format.dateTime(new Date(item.created_at), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
