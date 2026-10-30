import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BackLink } from "@/components/ui/back-link";
import { requireApprovedStudent } from "@/features/auth/guards";
import { StudentAvatar } from "@/features/students/components/student-card";
import { getLeaderboard } from "@/features/tests/queries";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tests");
  return { title: t("leaderboard") };
}

export default async function LeaderboardPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("tests");
  const common = await getTranslations("common");
  const boards = await getTranslations("boards");
  const rows = await getLeaderboard();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <BackLink href="/tests">{t("back")}</BackLink>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("leaderboard")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("leaderboardHint", {
            class: `${profile.board ? boards(profile.board) + " " : ""}${common("classLabel", { n: profile.class ?? 0 })}`,
          })}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title={t("leaderboardEmpty")} />
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li key={row.student_id}>
              <Card
                className={cn(
                  "flex items-center gap-3 p-3",
                  row.is_me && "border-primary bg-primary-soft",
                )}
              >
                <span className="w-8 text-center text-lg font-bold tabular-nums">{row.rank}</span>
                <StudentAvatar
                  student={{ full_name: row.display_name, email: row.display_name, avatar_url: row.avatar_url }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {row.display_name}
                    {row.is_me && <span className="ml-2 text-xs font-medium text-primary">{t("you")}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("testsTaken", { count: row.tests_taken })}
                  </p>
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {row.points}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">{t("points")}</span>
                </span>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
