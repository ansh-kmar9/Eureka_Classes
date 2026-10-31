import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/features/students/components/student-card";
import type { ResultRow } from "../queries";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-muted px-3 py-2.5 text-center">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Who took the test, how they did, and how each attempt ended. */
export function ScheduledResults({ rows, eligible }: { rows: ResultRow[]; eligible: number }) {
  const t = useTranslations("scheduledAdmin.results");
  const reasons = useTranslations("scheduledAdmin.reasons");

  const percent = (row: ResultRow) =>
    row.attempt.total ? Math.round(((row.attempt.score ?? 0) / row.attempt.total) * 100) : 0;
  const finished = rows.filter((row) => row.attempt.status === "submitted");
  const average = finished.length
    ? Math.round(finished.reduce((sum, row) => sum + percent(row), 0) / finished.length)
    : 0;
  const highest = finished.length ? Math.max(...finished.map(percent)) : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("attended")} value={`${rows.length}/${eligible}`} />
        <Stat label={t("average")} value={`${average}%`} />
        <Stat label={t("highest")} value={`${highest}%`} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("none")}</p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, index) => {
            const { attempt, student } = row;
            const inProgress = attempt.status === "in_progress";
            return (
              <li key={attempt.id}>
                <Card className="flex items-center gap-3 p-3">
                  <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <StudentAvatar student={student} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{student.full_name ?? student.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {inProgress ? (
                        <Badge tone="accent">{t("inProgress")}</Badge>
                      ) : (
                        attempt.submit_reason && (
                          <Badge tone={attempt.submit_reason === "manual" ? "neutral" : "danger"}>
                            {reasons(attempt.submit_reason as "manual")}
                          </Badge>
                        )
                      )}
                      {attempt.strikes > 0 && (
                        <Badge tone="danger">{t("warnings", { count: attempt.strikes })}</Badge>
                      )}
                    </div>
                  </div>
                  {!inProgress && (
                    <span className="text-right">
                      <span className="block text-lg font-bold tabular-nums">
                        {attempt.score}/{attempt.total}
                      </span>
                      <span className="text-xs text-muted-foreground">{percent(row)}%</span>
                    </span>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
