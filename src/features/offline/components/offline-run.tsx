"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CloudOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { markAnswers } from "@/features/tests/marking";
import { TestRunner, type RunnerSubmit } from "@/features/tests/components/test-runner";
import { getTest, queueAttempt, saveResult, type OfflineTest } from "@/lib/offline/db";
import { syncOutbox } from "../sync";

/** Runs a downloaded test entirely from the phone: marked on the spot, sent to the server later. */
export function OfflineRun({ userId }: { userId: string }) {
  const t = useTranslations("offlineTests");
  const testId = useSearchParams().get("id") ?? "";
  const [test, setTest] = useState<OfflineTest | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = testId ? await getTest(userId, testId).catch(() => undefined) : undefined;
      if (!cancelled) setTest(saved ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [testId, userId]);

  if (test === undefined) return <Skeleton className="h-96 w-full" />;

  if (test === null) {
    return (
      <EmptyState
        icon={CloudOff}
        title={t("missingTitle")}
        description={t("missingBody")}
        action={
          <Link href="/tests/offline" className={buttonVariants({ variant: "outline" })}>
            {t("backToList")}
          </Link>
        }
      />
    );
  }

  const handIn: RunnerSubmit = async (submission) => {
    try {
      // Saved first, so nothing is lost even if the app is closed straight afterwards.
      await queueAttempt({
        clientId: submission.clientId,
        userId,
        testId: test.id,
        answers: submission.answers,
        durationSeconds: submission.durationSeconds,
        submittedAt: submission.submittedAt,
        status: "pending",
      });
      await saveResult({
        clientId: submission.clientId,
        userId,
        testId: test.id,
        answers: submission.answers,
        score: markAnswers(test.questions, submission.answers),
        total: test.questions.length,
        durationSeconds: submission.durationSeconds,
        submittedAt: submission.submittedAt,
        synced: false,
      });
    } catch {
      return { ok: false };
    }

    // If there is a connection right now, send it straight away; otherwise it waits.
    void syncOutbox(userId).catch(() => {});
    return { ok: true, href: `/tests/offline/result?id=${submission.clientId}` };
  };

  return (
    <TestRunner
      testId={test.id}
      topic={test.topic}
      durationMinutes={test.durationMinutes}
      questions={test.questions.map(({ id, text, options }) => ({ id, text, options }))}
      submit={handIn}
    />
  );
}
