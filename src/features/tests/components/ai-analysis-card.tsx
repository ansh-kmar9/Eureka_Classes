"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, ListChecks, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeAttempt } from "../ai-actions";
import type { AiAnalysis } from "../analysis";

function Section({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Sparkles;
  title: string;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className={`size-4 ${tone}`} aria-hidden />
        {title}
      </h3>
      <ul className="space-y-1.5 pl-6 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Personalised feedback from Gemini for one practice attempt. Shown only on practice results. */
export function AiAnalysisCard({
  attemptId,
  initial,
}: {
  attemptId: string;
  /** Feedback already saved for this attempt, if the student asked before. */
  initial: AiAnalysis | null;
}) {
  const t = useTranslations("ai");
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      setError(null);
      const result = await analyzeAttempt(attemptId).catch(() => null);
      if (result?.ok) setAnalysis(result.analysis);
      else setError(result && !result.ok ? result.error : "generic");
    });

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          {!analysis && <p className="text-sm text-muted-foreground">{t("intro")}</p>}
        </div>
      </div>

      {pending && (
        <div className="space-y-2" role="status" aria-label={t("analysing")}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <p className="text-sm text-muted-foreground">{t("analysing")}</p>
        </div>
      )}

      {!analysis && !pending && (
        <>
          {error && (
            <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              {t(`errors.${error as "generic"}`)}
            </p>
          )}
          <Button onClick={run}>{error ? t("retry") : t("analyse")}</Button>
        </>
      )}

      {analysis && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
          <Section
            icon={CircleCheck}
            title={t("strengths")}
            items={analysis.strengths}
            tone="text-success"
          />
          <Section
            icon={Target}
            title={t("improvements")}
            items={analysis.improvements}
            tone="text-danger"
          />
          <Section
            icon={ListChecks}
            title={t("nextSteps")}
            items={analysis.nextSteps}
            tone="text-primary"
          />
          {analysis.encouragement && (
            <p className="rounded-control bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary">
              {analysis.encouragement}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
        </div>
      )}
    </Card>
  );
}
