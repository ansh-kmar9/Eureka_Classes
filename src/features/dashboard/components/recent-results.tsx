import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RecentResult } from "../queries";

/** The student's latest practice tests, each linking to its full result and review. */
export async function RecentResults({ results }: { results: RecentResult[] }) {
  const t = await getTranslations("dashboard.recent");
  const format = await getFormatter();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <Link href="/tests" className="text-sm font-medium text-primary">
          {t("takeTest")}
        </Link>
      </div>

      {results.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {results.map((result) => (
            <li key={result.attemptId}>
              <Link href={`/tests/attempts/${result.attemptId}`} className="block rounded-card">
                <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{result.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(result.submittedAt), { dateStyle: "medium" })}
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums">
                    {result.score}/{result.total}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
