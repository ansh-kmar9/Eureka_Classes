import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Check, CircleMinus, X } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireApprovedStudent } from "@/features/auth/guards";
import { parseAnalysis } from "@/features/tests/analysis";
import { AiAnalysisCard } from "@/features/tests/components/ai-analysis-card";
import { UNANSWERED } from "@/features/tests/marking";
import { getAttempt, getQuestions, getTestDetail } from "@/features/tests/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Result" };

const LETTERS = ["A", "B", "C", "D"];

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId, profile.id);
  if (!attempt) notFound();

  const found = await getTestDetail(attempt.test_id);
  if (!found) notFound();

  const t = await getTranslations("tests.result");
  const format = await getFormatter();
  const questions = await getQuestions(attempt.test_id);
  const percent = Math.round((attempt.score / attempt.total) * 100);
  const minutes = Math.floor(attempt.duration_seconds / 60);
  const seconds = attempt.duration_seconds % 60;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href={`/tests/subject/${found.subject.id}`}>{t("backToTests")}</BackLink>
      <Card className="space-y-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{found.topic.name}</p>
        <div>
          <p className="text-5xl font-bold tracking-tight">
            {attempt.score}
            <span className="text-2xl text-muted-foreground">/{attempt.total}</span>
          </p>
          <p className="mt-1 text-lg font-semibold text-primary">{percent}%</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("took", { minutes, seconds })} ·{" "}
          {format.dateTime(new Date(attempt.submitted_at), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/tests/${found.test.id}/take`} className={buttonVariants()}>
            {t("tryAgain")}
          </Link>
          <Link href={`/tests/subject/${found.subject.id}`} className={buttonVariants({ variant: "outline" })}>
            {t("backToTests")}
          </Link>
        </div>
      </Card>

      {/* Practice tests only: scheduled tests have no AI analysis. */}
      <AiAnalysisCard attemptId={attempt.id} initial={parseAnalysis(attempt.ai_analysis)} />

      <h2 className="text-lg font-semibold">{t("review")}</h2>
      <ol className="space-y-3">
        {questions.map((question, index) => {
          const chosen = attempt.answers[index] ?? UNANSWERED;
          const skipped = chosen === UNANSWERED;
          const right = chosen === question.correct;
          const Icon = skipped ? CircleMinus : right ? Check : X;

          return (
            <li key={question.id}>
              <Card className="space-y-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      skipped
                        ? "bg-surface-muted text-muted-foreground"
                        : right
                          ? "bg-success-soft text-success"
                          : "bg-danger-soft text-danger",
                    )}
                  >
                    <Icon className="size-4" aria-label={skipped ? t("skipped") : right ? t("correct") : t("wrong")} />
                  </span>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap font-medium leading-snug">
                    {index + 1}. {question.text}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correct;
                    const isChosenWrong = optionIndex === chosen && !isCorrect;
                    return (
                      <li
                        key={optionIndex}
                        className={cn(
                          "flex items-start gap-2 rounded-control border px-3 py-2 text-sm",
                          isCorrect && "border-success bg-success-soft",
                          isChosenWrong && "border-danger bg-danger-soft",
                          !isCorrect && !isChosenWrong && "border-border bg-background",
                        )}
                      >
                        <span className="font-semibold">{LETTERS[optionIndex]}.</span>
                        <span className="min-w-0 flex-1">{option}</span>
                        {optionIndex === chosen && (
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {t("yourAnswer")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {question.explanation && (
                  <p className="rounded-control bg-surface-muted p-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{t("explanation")}: </span>
                    {question.explanation}
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
