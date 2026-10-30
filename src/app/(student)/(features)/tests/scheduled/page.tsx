import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedStudent } from "@/features/auth/guards";
import { PhaseBadge } from "@/features/scheduled/components/phase-badge";
import { listScheduledTests, type ScheduledEntry } from "@/features/scheduled/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scheduled");
  return { title: t("title") };
}

export default async function StudentScheduledPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("scheduled");
  const format = await getFormatter();
  const entries = await listScheduledTests({ studentId: profile.id });

  const live = entries.filter((e) => e.phase === "live");
  const upcoming = entries
    .filter((e) => e.phase === "upcoming")
    .sort((a, b) => Date.parse(a.test.starts_at) - Date.parse(b.test.starts_at));
  const past = entries.filter((e) => e.phase === "ended" || e.phase === "cancelled");

  const section = (title: string, items: ScheduledEntry[]) =>
    items.length > 0 && (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ul className="space-y-2">
          {items.map(({ test, phase, attempt }) => (
            <li key={test.id}>
              <Link href={`/tests/scheduled/${test.id}`} className="block rounded-card">
                <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{test.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {format.dateTime(new Date(test.starts_at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {t("minutes", { count: test.duration_minutes })}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <PhaseBadge phase={phase} />
                      {attempt?.status === "submitted" && (
                        <Badge tone="success">
                          {t("score", { score: attempt.score ?? 0, total: attempt.total ?? 0 })}
                        </Badge>
                      )}
                      {attempt?.status === "in_progress" && <Badge tone="accent">{t("inProgress")}</Badge>}
                      {phase === "ended" && !attempt && <Badge tone="danger">{t("missed")}</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <>
          {section(t("liveNow"), live)}
          {section(t("upcoming"), upcoming)}
          {section(t("past"), past)}
        </>
      )}
    </div>
  );
}
