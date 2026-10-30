"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Dumbbell } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Phrase } from "@/lib/spoken/course";
import { buildQuiz, shuffle, type QuizQuestion } from "@/lib/spoken/quiz";
import { completePractice, type PracticeOutcome } from "../actions";
import { canSpeak } from "../speech";
import { QuizRunner } from "./quiz-runner";

const QUESTIONS_PER_ROUND = 10;

/** A mixed review of every phrase the student has learned so far. */
export function PracticeSession({
  learned,
  alreadyPracticed,
}: {
  /** Phrases from lessons the student has finished. */
  learned: Phrase[];
  alreadyPracticed: boolean;
}) {
  const t = useTranslations("spoken.practice");
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [outcome, setOutcome] = useState<PracticeOutcome | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const start = () => {
    // Built on a tap so the random questions never differ between server and phone.
    const chosen = shuffle(learned).slice(0, QUESTIONS_PER_ROUND);
    setQuiz(buildQuiz(chosen, learned, { allowListen: canSpeak() }));
    setOutcome(null);
    setScore(null);
  };

  const finish = async (correct: number, total: number) => {
    setScore({ correct, total });
    const result = await completePractice({ correct, total }).catch(
      () => ({ ok: false, error: "generic" }) as PracticeOutcome,
    );
    setOutcome(result);
  };

  if (quiz && !score) return <QuizRunner questions={quiz} onFinish={finish} />;

  if (score) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 py-8 text-center">
        <h2 className="text-2xl font-bold">{t("done")}</h2>
        <p className="text-lg">{t("score", { correct: score.correct, total: score.total })}</p>
        {outcome?.ok && outcome.xp > 0 && (
          <p className="text-lg font-bold text-primary">{t("xp", { xp: outcome.xp })}</p>
        )}
        {outcome?.ok && outcome.xp === 0 && (
          <p className="text-sm text-muted-foreground">{t("noMoreXp")}</p>
        )}
        {outcome && !outcome.ok && <p className="text-sm text-danger">{t("error")}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={start}>{t("again")}</Button>
          <Link href="/spoken-english" className={buttonVariants({ variant: "outline" })}>
            {t("back")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl space-y-4">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Dumbbell className="size-6" aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {alreadyPracticed ? t("introDone") : t("intro", { count: QUESTIONS_PER_ROUND })}
        </p>
      </div>
      <Button size="lg" className="w-full" onClick={start}>
        {t("start")}
      </Button>
    </Card>
  );
}
