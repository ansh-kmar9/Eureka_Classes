import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BackLink } from "@/components/ui/back-link";
import { requireApprovedStudent } from "@/features/auth/guards";
import { getSubjectEntry } from "@/features/tests/queries";

export const metadata: Metadata = { title: "Topics" };

export default async function SubjectTopicsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { subjectId } = await params;
  // Row-level security makes this null for any subject outside the student's board and class.
  const entry = await getSubjectEntry(subjectId, profile.id);
  if (!entry) notFound();

  const t = await getTranslations("tests");
  const { subject, topics } = entry;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/tests">{t("back")}</BackLink>

      <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>

      {topics.length === 0 ? (
        <EmptyState icon={Lock} title={t("noTopicsTitle")} description={t("noTopicsBody")} />
      ) : (
        <ol className="space-y-2">
          {topics.map(({ topic, test, questionCount, bestScore, attempts }, index) => {
            const ready = Boolean(test?.is_published);
            const body = (
              <Card
                className={
                  ready
                    ? "flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4"
                    : "flex items-center gap-3 p-3 opacity-70 sm:p-4"
                }
              >
                <span className="w-6 text-center text-sm text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{topic.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {!ready ? (
                      <Badge tone="accent">{t("comingSoon")}</Badge>
                    ) : bestScore !== null ? (
                      <>
                        <Badge tone="success">{t("best", { score: bestScore, total: questionCount })}</Badge>
                        <Badge>{t("attempts", { count: attempts })}</Badge>
                      </>
                    ) : (
                      <Badge tone="primary">{t("notAttempted")}</Badge>
                    )}
                  </div>
                </div>
                {ready && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
              </Card>
            );

            return (
              <li key={topic.id}>
                {ready && test ? (
                  <Link href={`/tests/${test.id}`} className="block rounded-card">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
