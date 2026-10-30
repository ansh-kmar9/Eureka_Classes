import "server-only";
import { currentStreak, istDay, type BadgeKey } from "@/lib/badges";
import { createAdminClient } from "@/lib/supabase/admin";

/** Grants any Spoken English badges the student has newly earned. */
export async function awardSpokenBadges(studentId: string): Promise<BadgeKey[]> {
  const admin = createAdminClient();

  const [{ count }, { data: activity }, { data: existing }] = await Promise.all([
    admin
      .from("spoken_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("student_id", studentId),
    admin.from("spoken_activity").select("day").eq("student_id", studentId),
    admin.from("student_badges").select("badge").eq("student_id", studentId),
  ]);

  const lessons = count ?? 0;
  const days = [...new Set(activity?.map((row) => row.day))];

  const earned: BadgeKey[] = [];
  if (lessons >= 1) earned.push("spoken_first");
  if (lessons >= 10) earned.push("spoken_ten");
  if (currentStreak(days, istDay(new Date())) >= 3) earned.push("spoken_streak_3");

  const have = new Set(existing?.map((row) => row.badge));
  const fresh = earned.filter((badge) => !have.has(badge));
  if (fresh.length) {
    await admin
      .from("student_badges")
      .upsert(
        fresh.map((badge) => ({ student_id: studentId, badge })),
        { onConflict: "student_id,badge", ignoreDuplicates: true },
      );
  }
  return fresh;
}
