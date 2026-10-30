"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { isCorrect, type QuizQuestion } from "@/lib/spoken/quiz";
import { cn } from "@/lib/utils";
import { speak } from "../speech";
import { ListenButtons } from "./listen-buttons";

type Feedback = { correct: boolean };

/**
 * Runs a quiz one question at a time with instant feedback, then reports how many were right.
 * Used for lessons and for the daily practice.
 */
export function QuizRunner({
  questions,
  onFinish,
}: {
  questions: QuizQuestion[];
  onFinish: (correct: number, total: number) => void;
}) {
  const t = useTranslations("spoken.quiz");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // For "arrange" questions: positions in `question.words`, in the order the student tapped them.
  const [chosen, setChosen] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const question = questions[index];
  const last = index === questions.length - 1;

  // A listening question plays its phrase as soon as it appears.
  useEffect(() => {
    if (question?.kind === "listen") void speak(question.audio);
  }, [question]);

  const answer = (response: number | string[]) => {
    if (feedback) return;
    const correct = isCorrect(question, response);
    setFeedback({ correct });
    if (correct) setCorrectCount((count) => count + 1);
  };

  const next = () => {
    if (last) {
      onFinish(correctCount, questions.length);
      return;
    }
    setIndex((value) => value + 1);
    setPicked(null);
    setChosen([]);
    setFeedback(null);
  };

  const options = question.kind === "arrange" ? [] : question.options;
  const solution = question.kind === "arrange" ? question.solution : options[question.answer];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="space-y-1.5">
        <ProgressBar value={index} max={questions.length} label={t("progress")} />
        <p className="text-sm text-muted-foreground">
          {t("position", { current: index + 1, total: questions.length })}
        </p>
      </div>

      <Card className="space-y-5 p-4 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">
          {question.kind === "meaning" && t("askMeaning")}
          {question.kind === "translate" && t("askTranslate")}
          {question.kind === "listen" && t("askListen")}
          {question.kind === "arrange" && t("askArrange")}
        </p>

        {question.kind === "meaning" && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-snug">{question.prompt}</h2>
            <ListenButtons text={question.prompt} size="sm" />
          </div>
        )}
        {question.kind === "translate" && (
          <h2 className="text-2xl font-bold leading-snug">{question.prompt}</h2>
        )}
        {question.kind === "arrange" && (
          <h2 className="text-xl font-bold leading-snug">{question.prompt}</h2>
        )}
        {question.kind === "listen" && (
          <Button size="lg" variant="secondary" onClick={() => void speak(question.audio)}>
            <Volume2 className="size-5" aria-hidden />
            {t("play")}
          </Button>
        )}

        {question.kind === "arrange" ? (
          <div className="space-y-4">
            <div
              className="flex min-h-14 flex-wrap gap-2 rounded-control border border-dashed border-border bg-background p-2.5"
              aria-label={t("yourSentence")}
            >
              {chosen.map((wordIndex, position) => (
                <button
                  key={`${wordIndex}-${position}`}
                  type="button"
                  disabled={Boolean(feedback)}
                  onClick={() => setChosen((current) => current.filter((_, i) => i !== position))}
                  className="min-h-10 rounded-control border border-primary bg-primary-soft px-3 text-sm font-semibold text-primary"
                >
                  {question.words[wordIndex]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {question.words.map((word, wordIndex) => (
                <button
                  key={wordIndex}
                  type="button"
                  disabled={Boolean(feedback) || chosen.includes(wordIndex)}
                  onClick={() => setChosen((current) => [...current, wordIndex])}
                  className={cn(
                    "min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-semibold transition-colors",
                    chosen.includes(wordIndex) ? "opacity-30" : "hover:bg-surface-muted",
                  )}
                >
                  {word}
                </button>
              ))}
            </div>
            {!feedback && (
              <Button
                className="w-full"
                disabled={chosen.length === 0}
                onClick={() => answer(chosen.map((i) => question.words[i]))}
              >
                {t("check")}
              </Button>
            )}
          </div>
        ) : (
          <div role="radiogroup" className="space-y-2.5">
            {options.map((option, optionIndex) => {
              const isAnswer = feedback && optionIndex === question.answer;
              const isWrongPick = feedback && picked === optionIndex && !feedback.correct;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  role="radio"
                  aria-checked={picked === optionIndex}
                  disabled={Boolean(feedback)}
                  onClick={() => {
                    setPicked(optionIndex);
                    answer(optionIndex);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center rounded-control border px-4 py-3 text-left font-medium transition-colors",
                    !feedback && "border-border bg-surface hover:bg-surface-muted",
                    isAnswer && "border-success bg-success-soft",
                    isWrongPick && "border-danger bg-danger-soft",
                    feedback && !isAnswer && !isWrongPick && "border-border bg-surface opacity-60",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {feedback && (
        <Card
          role="status"
          className={cn("space-y-3", feedback.correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft")}
        >
          <p
            className={cn(
              "flex items-center gap-2 font-semibold",
              feedback.correct ? "text-success" : "text-danger",
            )}
          >
            {feedback.correct ? (
              <CircleCheck className="size-5" aria-hidden />
            ) : (
              <CircleX className="size-5" aria-hidden />
            )}
            {feedback.correct ? t("correct") : t("wrong")}
          </p>
          {!feedback.correct && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("correctAnswer")} </span>
              <span className="font-semibold">{solution}</span>
            </p>
          )}
          <Button className="w-full" onClick={next}>
            {last ? t("seeResult") : t("continue")}
          </Button>
        </Card>
      )}
    </div>
  );
}
