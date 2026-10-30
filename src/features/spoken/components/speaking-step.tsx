"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Phrase } from "@/lib/spoken/course";
import { SPEAKING_CLOSE, SPEAKING_GOOD, speechScore } from "@/lib/spoken/quiz";
import { cn } from "@/lib/utils";
import { useCanListen } from "../hooks";
import { listen } from "../speech";
import { ListenButtons } from "./listen-buttons";

type Attempt = { score: number; heard: string } | null;
type Problem = "denied" | "nospeech" | "error" | null;

/**
 * Practise saying each phrase aloud. Where the phone can listen, it scores what it heard;
 * everywhere else the student simply taps "I said it". Either way the step is optional.
 */
export function SpeakingStep({
  phrases,
  onDone,
}: {
  phrases: Phrase[];
  onDone: () => void;
}) {
  const t = useTranslations("spoken.speak");
  const canListen = useCanListen();
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>(() => phrases.map(() => null));
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  const phrase = phrases[index];
  const attempt = attempts[index];
  const last = index === phrases.length - 1;

  const setAttempt = (value: Attempt) =>
    setAttempts((current) => current.map((a, i) => (i === index ? value : a)));

  const speakIt = async () => {
    setProblem(null);
    setListening(true);
    const result = await listen();
    setListening(false);

    if (!result.ok) {
      setProblem(result.reason === "unsupported" ? "error" : result.reason);
      return;
    }
    setAttempt({ score: speechScore(phrase.en, result.heard), heard: result.heard[0] });
  };

  const verdict =
    attempt === null
      ? null
      : attempt.score >= SPEAKING_GOOD
        ? "good"
        : attempt.score >= SPEAKING_CLOSE
          ? "close"
          : "again";

  const next = () => {
    if (last) onDone();
    else {
      setIndex((value) => value + 1);
      setProblem(null);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("position", { current: index + 1, total: phrases.length })}
      </p>

      <Card className="space-y-5 p-4 sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t("sayThis")}</p>
          <h2 className="text-2xl font-bold leading-snug">{phrase.en}</h2>
          <p className="text-muted-foreground">{phrase.hi}</p>
        </div>

        <ListenButtons text={phrase.en} size="sm" />

        {canListen ? (
          <Button size="lg" className="w-full" onClick={() => void speakIt()} disabled={listening}>
            <Mic className="size-5" aria-hidden />
            {listening ? t("listening") : attempt ? t("tryAgain") : t("tapToSpeak")}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("noMic")}</p>
            <Button
              size="lg"
              className="w-full"
              variant={attempt ? "secondary" : "primary"}
              onClick={() => setAttempt({ score: 100, heard: phrase.en })}
            >
              <Check className="size-5" aria-hidden />
              {t("saidIt")}
            </Button>
          </div>
        )}

        {problem && (
          <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {t(`problems.${problem}`)}
          </p>
        )}

        {attempt && canListen && (
          <div
            role="status"
            className={cn(
              "space-y-1 rounded-control border px-3 py-2.5",
              verdict === "good" && "border-success bg-success-soft",
              verdict === "close" && "border-accent bg-accent-soft",
              verdict === "again" && "border-danger bg-danger-soft",
            )}
          >
            <p className="font-semibold">{t(`verdict.${verdict ?? "again"}`)}</p>
            <p className="text-sm text-muted-foreground">
              {t("youSaid")} <span className="font-medium text-foreground">{attempt.heard || "-"}</span>
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onDone}>
          {t("skip")}
        </Button>
        <Button onClick={next}>{last ? t("toQuiz") : t("next")}</Button>
      </div>
    </div>
  );
}
