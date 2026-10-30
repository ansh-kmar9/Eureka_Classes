import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AudienceLabel } from "@/features/content/components/audience-label";
import { ClassFilter, parseClassParam } from "@/features/content/components/class-filter";
import { PhaseBadge } from "@/features/scheduled/components/phase-badge";
import { ScheduledTestForm } from "@/features/scheduled/components/scheduled-test-form";
import { listScheduledTests } from "@/features/scheduled/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scheduledAdmin");
  return { title: t("title") };
}

export default async function TeacherScheduledPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const t = await getTranslations("scheduledAdmin");
  const format = await getFormatter();
  const classFilter = parseClassParam((await searchParams).class);
  const entries = await listScheduledTests({ classFilter });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <ScheduledTestForm />

      <ClassFilter basePath="/teacher/tests/scheduled" selected={classFilter} />

      {entries.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("empty")} description={t("emptyBody")} />
      ) : (
        <ul className="space-y-2">
          {entries.map(({ test, phase }) => (
            <li key={test.id}>
              <Link href={`/teacher/tests/scheduled/${test.id}`} className="block rounded-card">
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
                      <Badge>
                        <AudienceLabel classNumber={test.class} stream={test.stream} />
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
