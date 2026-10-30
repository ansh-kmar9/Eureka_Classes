"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, CircleMinus, CloudOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UNANSWERED } from "@/features/tests/marking";
import { getResult, getTest, type LocalResult, type OfflineTest } from "@/lib/offline/db";
import { cn } from "@/lib/utils";
import { useOnline } from "../hooks";

const LETTERS = ["A", "B", "C", "D"];

/** The result of a test taken offline, with the full review, and whether it has reached the server yet. */
export function OfflineResult({ userId }: { userId: string }) {
  const t = useTranslations("offlineTests");
  const review = useTranslations("tests.result");
  const clientId = useSearchParams().get("id") ?? "";
  const online = useOnline();
  const [data, setData] = useState<{ result: LocalResult; test: OfflineTest } | null | undefined>(
    undefined,
  );

  // Load once; when online look again shortly, because syncing may just have finished.
  useEffect(() => {
    let cancelled = false;

    const read = async () => {
      const result = clientId ? await getResult(userId, clientId).catch(() => undefined) : undefined;
      const test = result ? await getTest(userId, result.testId).catch(() => undefined) : undefined;
      if (!cancelled) setData(result && test ? { result, test } : null);
    };

    void read();
    const timer = online ? setTimeout(() => void read(), 2500) : undefined;
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clientId, userId, online]);

  if (data === undefined) return <Skeleton className="h-72 w-full" />;

  if (data === null) {
    return (
      <EmptyState
        icon={CloudOff}
        title={t("noResultTitle")}
        description={t("noResultBody")}
        action={
          <Link href="/tests/offline" className={buttonVariants({ variant: "outline" })}>
            {t("backToList")}
          </Link>
        }
      />
    );
  }

  const { result, test } = data;
  const percent = Math.round((result.score / result.total) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{test.topic}</p>
        <div>
          <p className="text-5xl font-bold tracking-tight">
            {result.score}
            <span className="text-2xl text-muted-foreground">/{result.total}</span>
          </p>
          <p className="mt-1 text-lg font-semibold text-primary">{percent}%</p>
        </div>

        <div className="flex justify-center">
          {result.synced ? (
            <Badge tone="success">{t("synced")}</Badge>
          ) : (
            <Badge tone="accent">{online ? t("syncingNow") : t("notSynced")}</Badge>
          )}
        </div>
        {!result.synced && <p className="text-sm text-muted-foreground">{t("syncExplain")}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {result.synced && result.attemptId && online && (
            <Link href={`/tests/attempts/${result.attemptId}`} className={buttonVariants()}>
              {t("fullResult")}
            </Link>
          )}
          <Link href={`/tests/offline/run?id=${test.id}`} className={buttonVariants({ variant: "outline" })}>
            {t("tryAgain")}
          </Link>
          <Link href="/tests/offline" className={buttonVariants({ variant: "outline" })}>
            {t("backToList")}
          </Link>
        </div>
      </Card>

      <h2 className="text-lg font-semibold">{review("review")}</h2>
      <ol className="space-y-3">
        {test.questions.map((question, index) => {
          const chosen = result.answers[index] ?? UNANSWERED;
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
                    <Icon
                      className="size-4"
                      aria-label={skipped ? review("skipped") : right ? review("correct") : review("wrong")}
                    />
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
                            {review("yourAnswer")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {question.explanation && (
                  <p className="rounded-control bg-surface-muted p-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{review("explanation")}: </span>
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
