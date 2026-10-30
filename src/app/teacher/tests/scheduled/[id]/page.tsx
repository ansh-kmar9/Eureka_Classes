import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Check, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { AudienceLabel } from "@/features/content/components/audience-label";
import {
  addScheduledQuestion,
  cancelScheduledTest,
  deleteScheduledQuestion,
  deleteScheduledTest,
  importScheduledQuestions,
  publishScheduledTest,
} from "@/features/scheduled/actions";
import { PhaseBadge } from "@/features/scheduled/components/phase-badge";
import { ScheduledResults } from "@/features/scheduled/components/scheduled-results";
import { MAX_SCHEDULED_QUESTIONS } from "@/features/scheduled/schemas";
import {
  getQuestionsWithKeys,
  getScheduledResults,
  getScheduledTest,
  phaseOf,
} from "@/features/scheduled/queries";
import { ImportForm } from "@/features/tests/components/import-form";
import { QuestionForm } from "@/features/tests/components/question-form";
import { endsAtMs } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Scheduled test" };

const LETTERS = ["A", "B", "C", "D"];

export default async function TeacherScheduledDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await getScheduledTest(id);
  if (!test) notFound();

  const t = await getTranslations("scheduledAdmin");
  const toasts = await getTranslations("toasts");
  const format = await getFormatter();
  const phase = phaseOf(test);
  const questions = await getQuestionsWithKeys(id);
  const isDraft = test.status === "draft";
  const showResults = phase === "live" || phase === "ended";
  const results = showResults ? await getScheduledResults(test) : null;

  const when = (ms: number) =>
    format.dateTime(new Date(ms), { dateStyle: "medium", timeStyle: "short" });

  async function removeTest() {
    "use server";
    const result = await deleteScheduledTest(id);
    if (result.ok) redirect("/teacher/tests/scheduled");
    return result;
  }

  return (
    <div className="space-y-4">
      <BackLink href="/teacher/tests/scheduled">{t("back")}</BackLink>

      <Card className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={phase} />
            <Badge>
              <AudienceLabel classNumber={test.class} stream={test.stream} />
            </Badge>
            <Badge>{t("minutes", { count: test.duration_minutes })}</Badge>
            <Badge>{t("questionsCount", { count: questions.length })}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{test.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("window", {
              start: when(Date.parse(test.starts_at)),
              end: when(endsAtMs(test)),
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <ActionButton
              disabled={questions.length === 0}
              action={publishScheduledTest.bind(null, id)}
              successMessage={toasts("scheduled")}
              confirm={{
                title: t("publishTitle"),
                description: t("publishBody"),
                confirmLabel: t("publish"),
                cancelLabel: t("cancel"),
              }}
            >
              {t("publish")}
            </ActionButton>
          )}
          {test.status === "scheduled" && (
            <ActionButton
              variant="outline"
              action={cancelScheduledTest.bind(null, id)}
              successMessage={toasts("cancelled")}
              confirm={{
                title: t("cancelTitle"),
                description: t("cancelBody"),
                confirmLabel: t("cancelTest"),
                cancelLabel: t("keep"),
              }}
            >
              {t("cancelTest")}
            </ActionButton>
          )}
          {test.status !== "scheduled" && (
            <ActionButton
              variant="outline"
              action={removeTest}
              confirm={{
                title: t("deleteTitle"),
                description: t("deleteBody"),
                confirmLabel: t("delete"),
                cancelLabel: t("cancel"),
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("delete")}
            </ActionButton>
          )}
        </div>
        {isDraft && <p className="text-sm text-muted-foreground">{t("draftHint")}</p>}
      </Card>

      {results && <ScheduledResults rows={results.rows} eligible={results.eligible} />}

      <h2 className="text-lg font-semibold">{t("questionsTitle")}</h2>
      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("noQuestions")}</p>
        </Card>
      ) : (
        <ol className="space-y-3">
          {questions.map((question, index) => (
            <li key={question.id}>
              <Card className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm font-semibold text-muted-foreground">
                    {index + 1}.
                  </span>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap font-medium leading-snug">
                    {question.text}
                  </p>
                  {isDraft && (
                    <ActionButton
                      size="icon"
                      variant="ghost"
                      aria-label={t("deleteQuestion")}
                      action={deleteScheduledQuestion.bind(null, question.id)}
                      successMessage={toasts("deleted")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </ActionButton>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const correct = optionIndex === question.correct;
                    return (
                      <li
                        key={optionIndex}
                        className={cn(
                          "flex items-start gap-2 rounded-control border px-3 py-2 text-sm",
                          correct ? "border-success bg-success-soft" : "border-border bg-background",
                        )}
                      >
                        <span className="font-semibold">{LETTERS[optionIndex]}.</span>
                        <span className="min-w-0 flex-1">{option}</span>
                        {correct && <Check className="size-4 shrink-0 text-success" aria-hidden />}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {isDraft && (
        <>
          <QuestionForm add={addScheduledQuestion.bind(null, id)} disabled={false} />
          <ImportForm
            run={importScheduledQuestions.bind(null, id)}
            disabled={false}
            max={MAX_SCHEDULED_QUESTIONS}
          />
        </>
      )}
    </div>
  );
}
