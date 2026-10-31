import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookMarked, ChevronRight, CloudOff, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireApprovedStudent } from "@/features/auth/guards";
import { BoardPrompt } from "@/features/profile/components/board-prompt";
import { getCatalog } from "@/features/tests/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("test") };
}

export default async function TestsPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("tests");
  const common = await getTranslations("common");
  const boards = await getTranslations("boards");

  if (!profile.board || !profile.class) {
    return (
      <div className="mx-auto max-w-xl">
        <BoardPrompt />
      </div>
    );
  }

  const subjects = await getCatalog(
    { board: profile.board, class: profile.class, stream: profile.stream },
    { studentId: profile.id },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {boards(profile.board)} · {common("classLabel", { n: profile.class })}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/tests/offline" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CloudOff className="size-4" aria-hidden />
            {t("downloaded")}
          </Link>
          <Link href="/tests/leaderboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Trophy className="size-4" aria-hidden />
            {t("leaderboard")}
          </Link>
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon={BookMarked} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(({ subject, topics }) => {
            const available = topics.filter((entry) => entry.test?.is_published);
            const attempted = available.filter((entry) => entry.attempts > 0).length;
            return (
              <li key={subject.id}>
                <Link href={`/tests/subject/${subject.id}`} className="block h-full rounded-card">
                  <Card className="flex h-full flex-col gap-3 transition-colors hover:bg-surface-muted">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold leading-snug">{subject.name}</h2>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                    {available.length === 0 ? (
                      <Badge className="mt-auto w-fit" tone="accent">
                        {t("comingSoon")}
                      </Badge>
                    ) : (
                      <div className="mt-auto space-y-1.5">
                        <ProgressBar value={attempted} max={available.length} label={subject.name} />
                        <p className="text-xs text-muted-foreground">
                          {t("subjectProgress", { done: attempted, total: available.length })}
                        </p>
                      </div>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
