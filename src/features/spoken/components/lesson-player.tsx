"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Lightbulb, PartyPopper, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Bilingual, Phrase } from "@/lib/spoken/course";
import { buildQuiz, type QuizQuestion } from "@/lib/spoken/quiz";
import { PASS_PERCENT } from "@/lib/spoken/progress";
import { cn } from "@/lib/utils";
import { completeLesson, type LessonOutcome } from "../actions";
import { canSpeak } from "../speech";
import { ListenButtons } from "./listen-buttons";
import { QuizRunner } from "./quiz-runner";
import { SpeakingStep } from "./speaking-step";

type Step = "intro" | "learn" | "speak" | "quiz" | "result";
const STEPS: Step[] = ["learn", "speak", "quiz"];

/**
 * One lesson from start to finish: read the tip, learn the phrases, say them aloud,
 * take the quiz, and see the stars and XP earned.
 */
export function LessonPlayer({
  lessonId,
  title,
  tip,
  phrases,
  pool,
  locale,
}: {
  lessonId: string;
  title: Bilingual;
  tip: Bilingual;
  phrases: Phrase[];
  /** Other phrases from the same level, used as believable wrong answers. */
  pool: Phrase[];
  locale: "en" | "hi";
}) {
  const t = useTranslations("spoken");
  const [step, setStep] = useState<Step>("intro");
  const [cardIndex, setCardIndex] = useState(0);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<LessonOutcome | null>(null);

  const startQuiz = () => {
    // Built here, on a tap, so the random questions never differ between server and phone.
    setQuiz(buildQuiz(phrases, pool, { allowListen: canSpeak() }));
    setOutcome(null);
    setStep("quiz");
  };

  const finish = async (correct: number, total: number) => {
    setSaving(true);
    setStep("result");
    const result = await completeLesson({ lessonId, correct, total }).catch(
      () => ({ ok: false, error: "generic" }) as LessonOutcome,
    );
    setOutcome(result);
    setSaving(false);
  };

  const phrase = phrases[cardIndex];
  const stepNumber = STEPS.indexOf(step) + 1;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold tracking-tight">{title[locale]}</h1>
        {stepNumber > 0 && (
          <>
            <ProgressBar value={stepNumber - 1} max={STEPS.length} label={t("player.progress")} />
            <p className="text-xs text-muted-foreground">
              {t("player.step", { current: stepNumber, total: STEPS.length })}
              {" · "}
              {t(`player.steps.${step as "learn"}`)}
            </p>
          </>
        )}
      </div>

      {step === "intro" && (
        <Card className="space-y-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
            <Lightbulb className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">{t("player.tipTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tip[locale]}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("player.overview", { count: phrases.length })}
          </p>
          <Button size="lg" className="w-full" onClick={() => setStep("learn")}>
            {t("player.start")}
          </Button>
        </Card>
      )}

      {step === "learn" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("player.phrase", { current: cardIndex + 1, total: phrases.length })}
          </p>
          <Card className="space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{phrase.en}</h2>
              <p className="text-lg text-muted-foreground">{phrase.hi}</p>
            </div>
            <ListenButtons text={phrase.en} />
          </Card>

          <ol className="flex justify-center gap-1.5" aria-hidden>
            {phrases.map((_, i) => (
              <li
                key={i}
                className={cn("size-2 rounded-full", i === cardIndex ? "bg-primary" : "bg-border")}
              />
            ))}
          </ol>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={cardIndex === 0}
              onClick={() => setCardIndex((value) => value - 1)}
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("player.previous")}
            </Button>
            {cardIndex < phrases.length - 1 ? (
              <Button onClick={() => setCardIndex((value) => value + 1)}>
                {t("player.next")}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button onClick={() => setStep("speak")}>{t("player.startSpeaking")}</Button>
            )}
          </div>
        </div>
      )}

      {step === "speak" && <SpeakingStep phrases={phrases} onDone={startQuiz} />}

      {step === "quiz" && quiz.length > 0 && <QuizRunner questions={quiz} onFinish={finish} />}

      {step === "result" && (
        <Card className="space-y-5 py-8 text-center">
          {saving || !outcome ? (
            <p role="status" className="text-muted-foreground">
              {t("result.saving")}
            </p>
          ) : !outcome.ok ? (
            <>
              <p role="alert" className="text-danger">
                {outcome.error === "locked" ? t("result.locked") : t("result.error")}
              </p>
              <Link href="/spoken-english" className={buttonVariants({ variant: "outline" })}>
                {t("result.backToCourse")}
              </Link>
            </>
          ) : !outcome.passed ? (
            <>
              <h2 className="text-xl font-bold">{t("result.notYet")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("result.needed", { percent: PASS_PERCENT, got: outcome.percent })}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={startQuiz}>{t("result.tryAgain")}</Button>
                <Button variant="outline" onClick={() => { setCardIndex(0); setStep("learn"); }}>
                  {t("result.reviewPhrases")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-foreground">
                <PartyPopper className="size-7" aria-hidden />
              </span>
              <div>
                <h2 className="text-2xl font-bold">{t("result.complete")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("result.percent", { percent: outcome.percent })}
                </p>
              </div>
              <div className="flex justify-center gap-1.5" role="img" aria-label={t("result.stars", { count: outcome.stars })}>
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={cn("size-9", n <= outcome.stars ? "fill-accent text-accent" : "text-border")}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-lg font-bold text-primary">{t("result.xp", { xp: outcome.xp })}</p>
              {outcome.leveledUp && (
                <p className="rounded-control bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
                  {t("result.levelUp", { level: outcome.level })}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                {outcome.nextLessonId && (
                  <Link
                    href={`/spoken-english/lesson/${outcome.nextLessonId}`}
                    className={buttonVariants({ size: "lg" })}
                  >
                    {t("result.nextLesson")}
                  </Link>
                )}
                <Link
                  href="/spoken-english"
                  className={buttonVariants({ variant: outcome.nextLessonId ? "outline" : "primary", size: "lg" })}
                >
                  {t("result.backToCourse")}
                </Link>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
