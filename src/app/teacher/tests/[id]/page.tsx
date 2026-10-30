import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { AudienceLabel } from "@/features/content/components/audience-label";
import { scopeHref } from "@/features/catalog/scope";
import {
  addQuestion,
  deleteQuestion,
  deleteTest,
  importQuestions,
  setTestPublished,
} from "@/features/tests/actions";
import { ImportForm } from "@/features/tests/components/import-form";
import { QuestionForm } from "@/features/tests/components/question-form";
import { getQuestions, getTestDetail } from "@/features/tests/queries";
import { PRACTICE_QUESTION_COUNT } from "@/features/tests/schemas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Test" };

const LETTERS = ["A", "B", "C", "D"];

export default async function TeacherTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const found = await getTestDetail(id);
  if (!found) notFound();

  const t = await getTranslations("testsAdmin");
  const toasts = await getTranslations("toasts");
  const { test, topic, subject } = found;
  const boards = await getTranslations("boards");
  const backHref = scopeHref("/teacher/tests", {
    board: subject.board,
    class: subject.class,
    stream: subject.stream,
  });
  const questions = await getQuestions(id);
  const isFull = questions.length >= PRACTICE_QUESTION_COUNT;
  const canPublish = questions.length === PRACTICE_QUESTION_COUNT;

  async function removeTest() {
    "use server";
    const result = await deleteTest(id);
    if (result.ok) redirect("/teacher/tests");
    return result;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href={backHref}>{t("back")}</BackLink>

      <Card className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary">{subject.name}</Badge>
            <Badge>{boards(subject.board)}</Badge>
            <Badge>
              <AudienceLabel classNumber={subject.class} stream={subject.stream} />
            </Badge>
            <Badge>{t("minutes", { count: test.duration_minutes })}</Badge>
            <Badge tone={test.is_published ? "success" : "accent"}>
              {test.is_published ? t("published") : t("draft")}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{topic.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("questionsCount", { count: questions.length, total: PRACTICE_QUESTION_COUNT })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            variant={test.is_published ? "outline" : "primary"}
            disabled={!test.is_published && !canPublish}
            action={setTestPublished.bind(null, id, !test.is_published)}
            successMessage={test.is_published ? toasts("testUnpublished") : toasts("testPublished")}
          >
            {test.is_published ? t("unpublish") : t("publish")}
          </ActionButton>
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
        </div>
        {!test.is_published && !canPublish && (
          <p className="text-sm text-muted-foreground">
            {t("publishHint", { total: PRACTICE_QUESTION_COUNT })}
          </p>
        )}
      </Card>

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
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("question.delete")}
                    disabled={test.is_published}
                    action={deleteQuestion.bind(null, question.id)}
                    successMessage={toasts("deleted")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </ActionButton>
                </div>
                <ul className="space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const correct = optionIndex === question.correct;
                    return (
                      <li
                        key={optionIndex}
                        className={cn(
                          "flex items-start gap-2 rounded-control border px-3 py-2 text-sm",
                          correct
                            ? "border-success bg-success-soft"
                            : "border-border bg-background",
                        )}
                      >
                        <span className="font-semibold">{LETTERS[optionIndex]}.</span>
                        <span className="min-w-0 flex-1">{option}</span>
                        {correct && <Check className="size-4 shrink-0 text-success" aria-label={t("question.correct")} />}
                      </li>
                    );
                  })}
                </ul>
                {question.explanation && (
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}

      <QuestionForm add={addQuestion.bind(null, id)} disabled={isFull} />
      <ImportForm
        run={importQuestions.bind(null, id)}
        disabled={isFull}
        max={PRACTICE_QUESTION_COUNT}
      />
    </div>
  );
}
