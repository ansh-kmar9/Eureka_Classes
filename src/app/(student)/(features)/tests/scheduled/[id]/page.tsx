import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { requireApprovedStudent } from "@/features/auth/guards";
import { PhaseBadge } from "@/features/scheduled/components/phase-badge";
import { StartCountdown } from "@/features/scheduled/components/start-countdown";
import { getMyAttempt, getScheduledTest, phaseOf } from "@/features/scheduled/queries";
import { endsAtMs, MAX_STRIKES } from "@/lib/schedule";

export const metadata: Metadata = { title: "Scheduled test" };

export default async function StudentScheduledDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { id } = await params;
  // Row-level security hides drafts and other classes' tests, so this is null for them.
  const test = await getScheduledTest(id);
  if (!test) notFound();

  const t = await getTranslations("scheduled");
  const reasons = await getTranslations("scheduled.reasons");
  const format = await getFormatter();
  const attempt = await getMyAttempt(id, profile.id);
  const phase = phaseOf(test);

  const when = (ms: number) =>
    format.dateTime(new Date(ms), { dateStyle: "medium", timeStyle: "short" });
  const submitted = attempt?.status === "submitted";
  const canJoin = phase === "live" && !submitted;

  const rules = [
    t("rules.window"),
    t("rules.oneAttempt"),
    t("rules.fullscreen"),
    t("rules.warnings", { count: MAX_STRIKES }),
    t("rules.autoSubmit"),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/tests/scheduled">{t("back")}</BackLink>

      <Card className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={phase} />
            <Badge>{t("minutes", { count: test.duration_minutes })}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{test.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("window", { start: when(Date.parse(test.starts_at)), end: when(endsAtMs(test)) })}
          </p>
        </div>

        {phase === "cancelled" && (
          <p className="rounded-control bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
            {t("cancelledNote")}
          </p>
        )}

        {phase === "upcoming" && <StartCountdown startsAt={test.starts_at} />}

        {submitted && attempt && (
          <div className="space-y-2 rounded-control bg-surface-muted p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">{t("yourScore")}</p>
            <p className="text-5xl font-bold tracking-tight">
              {attempt.score}
              <span className="text-2xl text-muted-foreground">/{attempt.total}</span>
            </p>
            {attempt.total ? (
              <p className="text-lg font-semibold text-primary">
                {Math.round(((attempt.score ?? 0) / attempt.total) * 100)}%
              </p>
            ) : null}
            {attempt.submit_reason && attempt.submit_reason !== "manual" && (
              <p className="text-sm text-muted-foreground">
                {reasons(attempt.submit_reason as "time")}
              </p>
            )}
          </div>
        )}

        {phase === "ended" && !attempt && (
          <p className="rounded-control bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
            {t("missedNote")}
          </p>
        )}

        {(phase === "upcoming" || canJoin) && (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        )}

        {canJoin && (
          <Link
            href={`/tests/scheduled/${id}/take`}
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
          >
            <Play className="size-5" aria-hidden />
            {attempt ? t("resume") : t("start")}
          </Link>
        )}
      </Card>
    </div>
  );
}
