import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Flame, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LESSONS } from "@/lib/spoken/course";
import { rankFor } from "@/lib/spoken/progress";
import { cn } from "@/lib/utils";
import type { SpokenState } from "@/features/spoken/queries";

/** The student's Spoken English progress at a glance, with a way straight into the next lesson. */
export function SpokenCard({ state, locale }: { state: SpokenState; locale: "en" | "hi" }) {
  const t = useTranslations("dashboard.spoken");
  const spoken = useTranslations("spoken");

  const { level, xp, streak, stars } = state;
  const next = LESSONS.find(({ lesson }) => !stars.has(lesson.id));
  const finished = stars.size;

  const message = !next
    ? t("allDone")
    : finished === 0
      ? t("startFirst")
      : t("continue", { lesson: next.lesson.title[locale] });

  return (
    <Link href={next ? `/spoken-english/lesson/${next.lesson.id}` : "/spoken-english"} className="block rounded-card">
      <Card className="space-y-4 transition-colors hover:bg-surface-muted">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Mic className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{t("title")}</p>
            <h2 className="text-lg font-bold leading-tight">
              {spoken(`ranks.${rankFor(level.level)}`)}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                {spoken("levelLabel", { level: level.level })}
              </span>
            </h2>
          </div>
          <p
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
              streak > 0 ? "bg-accent-soft text-accent-foreground" : "bg-surface-muted text-muted-foreground",
            )}
          >
            <Flame className="size-3.5" aria-hidden />
            {streak}
          </p>
        </div>

        <div className="space-y-1.5">
          <ProgressBar value={level.into} max={level.span} label={spoken("xpProgress")} />
          <p className="flex justify-between text-xs text-muted-foreground">
            <span>{spoken("xpTotal", { xp })}</span>
            <span>{spoken("lessonsDone", { done: finished, total: LESSONS.length })}</span>
          </p>
        </div>

        <p className="flex items-center justify-between gap-2 text-sm font-medium">
          <span className="min-w-0">{message}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </p>
      </Card>
    </Link>
  );
}
