"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Clock, LayoutGrid, ShieldAlert, TriangleAlert } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UNANSWERED } from "@/features/tests/marking";
import { MAX_STRIKES } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  saveScheduledAnswers,
  startScheduledAttempt,
  submitScheduledAttempt,
} from "../actions";

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface Run {
  attemptId: string;
  deadlineMs: number;
  questions: Question[];
}

type Stage = "gate" | "starting" | "running" | "finished";
type GateError = "fullscreen" | "notLive" | "already" | "unauthorized" | "generic";

const LETTERS = ["A", "B", "C", "D"];
const HEARTBEAT_MS = 20_000;
const AUTOSAVE_MS = 1_000;

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${hours > 0 ? `${hours}:` : ""}${pad(minutes)}:${pad(total % 60)}`;
};

const canFullscreen = () => typeof document.documentElement.requestFullscreen === "function";
const subscribeNothing = () => () => {};

/**
 * The live exam. It runs in fullscreen and hands the test in by itself if the student leaves
 * fullscreen or goes back, and after three trips out of the app. The server owns the clock
 * and the marking; this screen only collects answers and reports what the student does.
 */
export function ScheduledRunner({
  testId,
  title,
  endsAt,
  resuming,
}: {
  testId: string;
  title: string;
  /** ISO time the test window closes. */
  endsAt: string;
  /** True if the student already started and is coming back. */
  resuming: boolean;
}) {
  const t = useTranslations("scheduled.runner");
  const router = useRouter();

  // False while rendering on the server, then the real answer on the phone (no hydration mismatch).
  const fullscreenSupported = useSyncExternalStore(subscribeNothing, canFullscreen, () => false);

  const [stage, setStage] = useState<Stage>("gate");
  const [gateError, setGateError] = useState<GateError | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  // True while the phone is not in fullscreen; shows a blocking "return to fullscreen" screen.
  const [outOfFullscreen, setOutOfFullscreen] = useState(false);

  // Difference between the server clock and this phone's clock, so the timer is the server's.
  const offset = useRef(0);
  const answersRef = useRef<number[]>([]);
  const ending = useRef(false);
  const autoEnded = useRef(false);
  const fullscreenRequired = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastWarningAt = useRef(0);
  const lastHiddenAt = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const syncClock = (serverNow: string) => {
    offset.current = Date.parse(serverNow) - Date.now();
  };

  const leaveFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);

  /** Hands in the test (once) and returns to the result page. */
  const end = useCallback(
    async (reason: "manual" | "time"): Promise<{ ok: boolean }> => {
      if (!run || ending.current) return { ok: false };
      ending.current = true;
      setSubmitError(false);

      const result = await submitScheduledAttempt(run.attemptId, answersRef.current, reason).catch(
        () => ({ ok: false }),
      );

      if (result.ok) {
        setStage("finished");
        leaveFullscreen();
        router.replace(`/tests/scheduled/${testId}`);
        return { ok: true };
      }
      ending.current = false;
      setSubmitError(true);
      return { ok: false };
    },
    [run, testId, router, leaveFullscreen],
  );

  // Always use the latest `end` from event handlers without re-registering them.
  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });

  const begin = async () => {
    setGateError(null);
    setStage("starting");

    // Fullscreen must be requested straight from the tap, before anything is awaited.
    fullscreenRequired.current = canFullscreen();
    if (fullscreenRequired.current) {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } catch {
        setGateError("fullscreen");
        setStage("gate");
        return;
      }
    }

    const result = await startScheduledAttempt(testId).catch(() => null);
    if (!result || !result.ok) {
      leaveFullscreen();
      const error = result && !result.ok ? result.error : "generic";
      setGateError(error);
      setStage("gate");
      if (error === "already") router.replace(`/tests/scheduled/${testId}`);
      return;
    }

    syncClock(result.serverNow);
    setRun({
      attemptId: result.attemptId,
      deadlineMs: Date.parse(result.deadlineAt),
      questions: result.questions,
    });
    setAnswers(result.answers);
    setStrikes(result.strikes);
    setNow(Date.now() + offset.current);
    // A history entry to land on, so the Back button is noticed instead of leaving the page.
    window.history.pushState(null, "", window.location.href);
    setStage("running");
  };

  // Saves answers and checks in with the server; the reply carries warnings and the clock.
  const checkIn = useCallback(async () => {
    if (!run || ending.current) return;
    const result = await saveScheduledAnswers(run.attemptId, answersRef.current).catch(() => null);
    if (!result || ending.current) return;
    if (result.status === "submitted") {
      ending.current = true;
      setStage("finished");
      leaveFullscreen();
      router.replace(`/tests/scheduled/${testId}`);
    } else if (result.status === "in_progress") {
      syncClock(result.serverNow);
      setStrikes(result.strikes);
    }
  }, [run, testId, router, leaveFullscreen]);

  // Debounced autosave when an answer changes.
  useEffect(() => {
    if (stage !== "running") return;
    const timer = setTimeout(() => void checkIn(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [answers, stage, checkIn]);

  // Regular check-in, so a dropped connection or a server-side submit is noticed.
  useEffect(() => {
    if (stage !== "running") return;
    const timer = setInterval(() => void checkIn(), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [stage, checkIn]);

  // The server's clock, ticking. Time up hands the test in once.
  useEffect(() => {
    if (stage !== "running" || !run) return;
    const timer = setInterval(() => {
      const current = Date.now() + offset.current;
      setNow(current);
      if (current >= run.deadlineMs && !autoEnded.current) {
        autoEnded.current = true;
        void endRef.current("time");
      }
    }, 500);
    return () => clearInterval(timer);
  }, [stage, run]);

  // Integrity watch. Leaving fullscreen, pressing Back and leaving the app each count as a
  // warning; the third one hands the test in (the server does that, so it cannot be dodged).
  useEffect(() => {
    if (stage !== "running" || !run) return;
    const attemptId = run.attemptId;

    const warn = (type: "hidden" | "fullscreen_exit" | "navigation") => {
      // One real action can fire several browser events at once; count it once.
      if (Date.now() - lastWarningAt.current < 1500) return;
      lastWarningAt.current = Date.now();

      const body = JSON.stringify({ attemptId, type });
      if (type === "hidden") {
        // sendBeacon still gets through while the app is being closed or sent to the background.
        navigator.sendBeacon("/api/scheduled/event", new Blob([body], { type: "application/json" }));
        setStrikes((current) => current + 1);
        return;
      }

      setStrikes((current) => current + 1);
      void fetch("/api/scheduled/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then((response) => response.json())
        .then((reply: { status?: string; strikes?: number }) => {
          if (typeof reply.strikes === "number") setStrikes(reply.strikes);
          if (reply.status === "submitted" && !ending.current) {
            ending.current = true;
            setStage("finished");
            leaveFullscreen();
            router.replace(`/tests/scheduled/${testId}`);
          }
        })
        .catch(() => {});
    };

    const checkFullscreen = () =>
      setOutOfFullscreen(fullscreenRequired.current && !document.fullscreenElement);

    const onFullscreenChange = () => {
      checkFullscreen();
      if (!fullscreenRequired.current || document.fullscreenElement) return;
      // Backgrounding the app also closes fullscreen; that is already counted as "hidden".
      const withApp = document.hidden || Date.now() - lastHiddenAt.current < 2000;
      if (!withApp) warn("fullscreen_exit");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt.current = Date.now();
        warn("hidden");
      } else {
        checkFullscreen();
        void checkIn();
      }
    };
    const onPopState = () => {
      // Put the page back so Back does not actually leave, then count the attempt.
      window.history.pushState(null, "", window.location.href);
      warn("navigation");
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [stage, run, checkIn, router, testId, leaveFullscreen]);

  const returnToFullscreen = () => {
    void document.documentElement
      .requestFullscreen({ navigationUI: "hide" })
      .then(() => setOutOfFullscreen(false))
      .catch(() => {});
  };

  const answeredCount = useMemo(() => answers.filter((a) => a !== UNANSWERED).length, [answers]);

  /* ------------------------------- Gate screen ------------------------------- */

  if (stage === "gate" || stage === "starting") {
    const minutesLeft = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 60_000));
    const rules = [
      t("rules.window"),
      t("rules.oneAttempt"),
      fullscreenSupported ? t("rules.fullscreen") : t("rules.noFullscreen"),
      t("rules.warnings", { count: MAX_STRIKES }),
      t("rules.autoSubmit"),
    ];

    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="space-y-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-foreground">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {resuming ? t("resumeInfo", { minutes: minutesLeft }) : t("timeLeft", { minutes: minutesLeft })}
            </p>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          {gateError && (
            <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              {t(`errors.${gateError}`)}
            </p>
          )}

          <Button size="lg" className="w-full" disabled={stage === "starting"} onClick={() => void begin()}>
            {stage === "starting" ? t("starting") : resuming ? t("resume") : t("begin")}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "finished" || !run) {
    return (
      <p role="status" className="py-20 text-center text-muted-foreground">
        {t("submitting")}
      </p>
    );
  }

  /* ------------------------------- Exam screen ------------------------------- */

  const remaining = run.deadlineMs - now;
  const question = run.questions[index];
  const selected = answers[index] ?? UNANSWERED;
  const unanswered = run.questions.length - answeredCount;

  const choose = (optionIndex: number) =>
    remaining > 0 &&
    setAnswers((current) => current.map((a, i) => (i === index ? optionIndex : a)));
  const goTo = (target: number) => {
    setIndex(target);
    setPaletteOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    // A full-screen layer above the app's header and navigation, so nothing can be tapped to leave.
    <div ref={scrollRef} className="fixed inset-0 z-[60] overflow-y-auto bg-background px-4 pb-8">
    <div
      className="mx-auto max-w-2xl select-none space-y-4"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
    >
      {outOfFullscreen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-background/95 px-6 backdrop-blur">
          <Card className="w-full max-w-sm space-y-4 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <TriangleAlert className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{t("fullscreenLost.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("fullscreenLost.body")}</p>
            </div>
            <Button size="lg" className="w-full" onClick={returnToFullscreen}>
              {t("fullscreenLost.action")}
            </Button>
          </Card>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-4 space-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p
            role="timer"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums",
              remaining <= 5 * 60_000 ? "bg-danger-soft text-danger" : "bg-surface-muted",
            )}
          >
            <Clock className="size-4" aria-hidden />
            {clock(remaining)}
          </p>
        </div>
        <ProgressBar value={answeredCount} max={run.questions.length} label={t("progress")} />
        <p className="text-xs text-muted-foreground">
          {t("position", { current: index + 1, total: run.questions.length })} ·{" "}
          {t("answered", { count: answeredCount })}
        </p>
      </div>

      {strikes > 0 && (
        <Card className="flex items-start gap-3 border-danger bg-danger-soft">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <p role="alert" className="text-sm font-medium text-danger">
            {t("warning", { current: strikes, max: MAX_STRIKES })}
          </p>
        </Card>
      )}

      {submitError && (
        <Card className="space-y-3 border-danger bg-danger-soft">
          <p role="alert" className="text-sm font-medium text-danger">
            {t("submitFailed")}
          </p>
          <Button size="sm" onClick={() => void end("manual")}>
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
        <Button disabled={index === run.questions.length - 1} onClick={() => goTo(index + 1)}>
          {t("next")}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      <ActionButton
        size="lg"
        variant={index === run.questions.length - 1 ? "primary" : "secondary"}
        className="w-full"
        action={() => end("manual")}
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
            {run.questions.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t("goToQuestion", { n: i + 1 })}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "flex size-12 w-full items-center justify-center rounded-control border text-sm font-semibold",
                    answers[i] !== UNANSWERED
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface",
                    i === index && "ring-2 ring-ring ring-offset-2 ring-offset-surface",
                  )}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
    </div>
  );
}
