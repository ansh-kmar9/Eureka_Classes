import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireApprovedStudent } from "@/features/auth/guards";
import { DownloadButton } from "@/features/offline/components/download-button";
import { getAttempts, getQuestions, getTestDetail } from "@/features/tests/queries";

export const metadata: Metadata = { title: "Test" };

export default async function TestIntroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { id } = await params;
  const found = await getTestDetail(id);
  if (!found) notFound();

  const t = await getTranslations("tests");
  const format = await getFormatter();
  const { test, topic, subject } = found;
  const [questions, attempts] = await Promise.all([
    getQuestions(id),
    getAttempts(id, profile.id),
  ]);
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;

  const rules = [
    t("rules.timer", { minutes: test.duration_minutes }),
    t("rules.autoSubmit"),
    t("rules.retake"),
    t("rules.best"),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/tests/subject/${subject.id}`}
        className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <Card className="space-y-4">
        <div className="space-y-2">
          <Badge tone="primary" className="w-fit">
            {subject.name}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">{topic.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("meta", { count: questions.length, minutes: test.duration_minutes })}
          </p>
          {best !== null && (
            <Badge tone="success" className="w-fit">
              {t("best", { score: best, total: questions.length })}
            </Badge>
          )}
        </div>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>

        <Link
          href={`/tests/${id}/take`}
          className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
        >
          <Play className="size-5" aria-hidden />
          {attempts.length ? t("startAgain") : t("start")}
        </Link>

        <DownloadButton testId={id} userId={profile.id} />
      </Card>

      {attempts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("history")}</h2>
          <ul className="space-y-2">
            {attempts.map((attempt) => (
              <li key={attempt.id}>
                <Link href={`/tests/attempts/${attempt.id}`} className="block rounded-card">
                  <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4">
                    <span className="text-lg font-bold">
                      {attempt.score}/{attempt.total}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                      {format.dateTime(new Date(attempt.submitted_at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
