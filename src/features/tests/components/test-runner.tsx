"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Clock, LayoutGrid } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { submitPracticeAttempt } from "../actions";
import { UNANSWERED } from "../marking";

export interface RunnerQuestion {
  id: string;
  text: string;
  options: string[];
}

interface Session {
  clientId: string;
  startedAt: number;
  answers: number[];
}

const LETTERS = ["A", "B", "C", "D"];
const storageKey = (testId: string) => `eureka:attempt:${testId}`;

function loadSession(testId: string, count: number): Session {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(testId)) ?? "null") as Session | null;
    if (saved && saved.answers.length === count && saved.clientId && saved.startedAt) return saved;
  } catch {
    // Unreadable or blocked storage: start fresh.
  }
  return {
    clientId: crypto.randomUUID(),
    startedAt: Date.now(),
    answers: Array(count).fill(UNANSWERED),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Runs a timed test. Progress survives a page reload (kept for this tab only), and the
 * test is submitted by itself when the time is up.
 */
/** What the runner hands over when a test is finished. */
export interface RunnerSubmission {
  clientId: string;
  answers: number[];
  durationSeconds: number;
  submittedAt: string;
}

/** Where to go after a hand-in, or `ok: false` to let the student try again. */
export type RunnerSubmit = (
  submission: RunnerSubmission,
) => Promise<{ ok: true; href: string } | { ok: false }>;

export function TestRunner({
  testId,
  topic,
  durationMinutes,
  questions,
  submit,
}: {
  testId: string;
  topic: string;
  durationMinutes: number;
  questions: RunnerQuestion[];
  /** Custom hand-in, used for offline tests. By default the answers go to the server. */
  submit?: RunnerSubmit;
}) {
  const t = useTranslations("tests.runner");
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const submitting = useRef(false);

  const limitMs = durationMinutes * 60 * 1000;

  // Browser storage is only readable after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession(testId, questions.length));
  }, [testId, questions.length]);

  useEffect(() => {
    if (!session) return;
    try {
      sessionStorage.setItem(storageKey(testId), JSON.stringify(session));
    } catch {
      // Progress just won't survive a reload.
    }
  }, [session, testId]);

  const finish = useCallback(async (): Promise<{ ok: boolean }> => {
    if (!session || submitting.current) return { ok: false };
    submitting.current = true;
    setSubmitError(false);

    const elapsed = Math.min(Date.now() - session.startedAt, limitMs);
    const submission: RunnerSubmission = {
      clientId: session.clientId,
      answers: session.answers,
      durationSeconds: Math.round(elapsed / 1000),
      submittedAt: new Date().toISOString(),
    };

    const handIn: RunnerSubmit =
      submit ??
      (async (payload) => {
        const result = await submitPracticeAttempt({ testId, ...payload });
        return result.ok ? { ok: true, href: `/tests/attempts/${result.attemptId}` } : { ok: false };
      });
    const result = await handIn(submission).catch(() => null);

    if (result?.ok) {
      try {
        sessionStorage.removeItem(storageKey(testId));
      } catch {
        // Nothing to clean up.
      }
      router.replace(result.href);
      return { ok: true };
    }

    submitting.current = false;
    setSubmitError(true);
    return { ok: false };
  }, [session, testId, limitMs, router, submit]);

  const remaining = session ? session.startedAt + limitMs - now : limitMs;
  const timeUp = Boolean(session) && remaining <= 0;

  // Always call the latest `finish` from the timer without restarting the timer.
  const autoSubmitted = useRef(false);
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  // Tick, and submit automatically when the time is up.
  useEffect(() => {
    if (!session) return;
    const deadline = session.startedAt + limitMs;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      // Fire once; if it fails, the student retries with the button.
      if (current >= deadline && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void finishRef.current();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [session, limitMs]);

  // Warn before closing the tab mid-test.
  useEffect(() => {
    if (!session) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session]);

  const answeredCount = useMemo(
    () => session?.answers.filter((a) => a !== UNANSWERED).length ?? 0,
    [session],
  );

  if (!session) return <Skeleton className="h-96 w-full" />;

  const question = questions[index];
  const selected = session.answers[index];
  const unanswered = questions.length - answeredCount;
  const lowTime = remaining <= 5 * 60 * 1000;

  const choose = (optionIndex: number) =>
    !timeUp &&
    setSession((current) =>
      current
        ? {
            ...current,
            answers: current.answers.map((a, i) => (i === index ? optionIndex : a)),
          }
        : current,
    );

  const goTo = (target: number) => {
    setIndex(target);
    setPaletteOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="sticky top-16 z-20 -mx-4 space-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{topic}</p>
          <p
            role="timer"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums",
              lowTime ? "bg-danger-soft text-danger" : "bg-surface-muted",
            )}
          >
            <Clock className="size-4" aria-hidden />
            {formatClock(remaining)}
          </p>
        </div>
        <ProgressBar value={answeredCount} max={questions.length} label={t("progress")} />
        <p className="text-xs text-muted-foreground">
          {t("position", { current: index + 1, total: questions.length })}
          {" · "}
          {t("answered", { count: answeredCount })}
        </p>
      </div>

      {submitError && (
        <Card className="space-y-3 border-danger bg-danger-soft">
          <p role="alert" className="text-sm font-medium text-danger">
            {t("submitFailed")}
          </p>
          <Button size="sm" onClick={() => void finish()}>
            {t("retry")}
          </Button>
        </Card>
      )}

      <Card className="space-y-5 p-4 sm:p-6">
        <h2 className="whitespace-pre-wrap text-lg font-semibold leading-snug">{question.text}</h2>

        <div role="radiogroup" aria-label={question.text} className="space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const checked = selected === optionIndex;
            return (
              <button
                key={optionIndex}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => choose(optionIndex)}
                className={cn(
                  "flex min-h-14 w-full items-start gap-3 rounded-control border px-4 py-3 text-left transition-colors",
                  checked
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {LETTERS[optionIndex]}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>

        {selected !== UNANSWERED && (
          <button
            type="button"
            onClick={() => choose(UNANSWERED)}
            className="text-sm font-medium text-muted-foreground underline underline-offset-4"
          >
            {t("clear")}
          </button>
        )}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ArrowLeft className="size-4" aria-hidden />
          {t("previous")}
        </Button>
        <Button variant="outline" size="icon" aria-label={t("questionList")} onClick={() => setPaletteOpen(true)}>
          <LayoutGrid className="size-5" aria-hidden />
        </Button>
        <Button disabled={index === questions.length - 1} onClick={() => goTo(index + 1)}>
          {t("next")}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      <ActionButton
        size="lg"
        variant={index === questions.length - 1 ? "primary" : "secondary"}
        className="w-full"
        action={finish}
        confirm={{
          title: t("submitTitle"),
          description: unanswered > 0 ? t("submitUnanswered", { count: unanswered }) : t("submitReady"),
          confirmLabel: t("submit"),
          cancelLabel: t("keepGoing"),
        }}
      >
        {t("submit")}
      </ActionButton>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent title={t("questionList")} closeLabel={t("close")}>
          <ul className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
            {questions.map((q, i) => {
              const done = session.answers[i] !== UNANSWERED;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={t("goToQuestion", { n: i + 1 })}
                    aria-current={i === index ? "true" : undefined}
                    className={cn(
                      "flex size-12 w-full items-center justify-center rounded-control border text-sm font-semibold",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface",
                      i === index && "ring-2 ring-ring ring-offset-2 ring-offset-surface",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("answered", { count: answeredCount })} · {t("remainingQuestions", { count: unanswered })}
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
