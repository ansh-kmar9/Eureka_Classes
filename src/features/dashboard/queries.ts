import "server-only";
import { getBadges, getLeaderboard } from "@/features/tests/queries";
import { createClient } from "@/lib/supabase/server";
import type { BadgeKey } from "@/lib/badges";

export interface RecentResult {
  attemptId: string;
  topic: string;
  score: number;
  total: number;
  submittedAt: string;
}

export interface DashboardStats {
  testsTaken: number;
  /** Average of the student's best percentage on each test they have taken, or null if none. */
  averagePercent: number | null;
  /** Position in the class leaderboard, or null if they have not taken a test yet. */
  rank: number | null;
  earnedBadges: BadgeKey[];
  recent: RecentResult[];
}

/** Everything the student dashboard shows about test performance, in a few small queries. */
export async function getDashboardStats(studentId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ data: attempts }, badges, leaderboard] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("id, test_id, score, total, submitted_at")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false }),
    getBadges(studentId),
    getLeaderboard(),
  ]);

  const all = attempts ?? [];

  // Best percentage per test, so retaking a test can only improve the average.
  const best = new Map<string, number>();
  for (const attempt of all) {
    const percent = (attempt.score / attempt.total) * 100;
    best.set(attempt.test_id, Math.max(best.get(attempt.test_id) ?? 0, percent));
  }
  const averagePercent = best.size
    ? Math.round([...best.values()].reduce((sum, value) => sum + value, 0) / best.size)
    : null;

  // Topic names for the most recent attempts.
  const latest = all.slice(0, 5);
  const topicByTest = new Map<string, string>();
  if (latest.length) {
    const { data: tests } = await supabase
      .from("practice_tests")
      .select("id, topic_id")
      .in("id", [...new Set(latest.map((a) => a.test_id))]);
    const { data: topics } = tests?.length
      ? await supabase
          .from("catalog_topics")
          .select("id, name")
          .in("id", tests.map((test) => test.topic_id))
      : { data: [] };
    const nameOf = new Map(topics?.map((topic) => [topic.id, topic.name]));
    tests?.forEach((test) => topicByTest.set(test.id, nameOf.get(test.topic_id) ?? ""));
  }

  return {
    testsTaken: all.length,
    averagePercent,
    rank: leaderboard.find((row) => row.is_me)?.rank ?? null,
    earnedBadges: badges.map((badge) => badge.badge as BadgeKey),
    recent: latest.map((attempt) => ({
      attemptId: attempt.id,
      topic: topicByTest.get(attempt.test_id) ?? "",
      score: attempt.score,
      total: attempt.total,
      submittedAt: attempt.submitted_at,
    })),
  };
}
