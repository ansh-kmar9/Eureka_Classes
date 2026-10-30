import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Dumbbell, Flame, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LESSONS } from "@/lib/spoken/course";
import { rankFor } from "@/lib/spoken/progress";
import { cn } from "@/lib/utils";
import type { SpokenState } from "../queries";

/** Rank, level, XP, streak and the daily practice card: the "game" part of the course. */
export function SpokenHeader({ state }: { state: SpokenState }) {
  const t = useTranslations("spoken");
  const { level, xp, streak, activeToday, practicedToday, stars } = state;
  const done = stars.size;
  const hasLearned = done > 0;

  return (
    <div className="space-y-3">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("levelLabel", { level: level.level })}</p>
            <h2 className="text-xl font-bold">{t(`ranks.${rankFor(level.level)}`)}</h2>
          </div>
          <p
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
              streak > 0 ? "bg-accent-soft text-accent-foreground" : "bg-surface-muted text-muted-foreground",
            )}
          >
            <Flame className="size-4" aria-hidden />
            {t("streak", { count: streak })}
          </p>
        </div>

        <div className="space-y-1.5">
          <ProgressBar value={level.into} max={level.span} label={t("xpProgress")} />
          <p className="flex justify-between text-xs text-muted-foreground">
            <span>{t("xpTotal", { xp })}</span>
            <span>{t("xpToNext", { xp: level.span - level.into, level: level.level + 1 })}</span>
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("lessonsDone", { done, total: LESSONS.length })}
          {streak === 0 && !activeToday && <> · {t("startStreak")}</>}
        </p>
      </Card>

      {hasLearned ? (
        <Link href="/spoken-english/practice" className="block rounded-card">
          <Card className="flex items-center gap-3 transition-colors hover:bg-surface-muted">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              {practicedToday ? <CheckCircle2 className="size-6" aria-hidden /> : <Dumbbell className="size-6" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("practice.cardTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {practicedToday ? t("practice.cardDone") : t("practice.cardBody")}
              </p>
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="flex items-center gap-3 opacity-70">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
            <Lock className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t("practice.cardTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("practice.cardLocked")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
