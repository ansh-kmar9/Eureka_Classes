import "server-only";
import { badgesFromAttempts, istDay, type BadgeKey } from "@/lib/badges";
import { createAdminClient } from "@/lib/supabase/admin";

/** Grants any badges the student has newly earned. Returns the ones that are new. */
export async function awardAttemptBadges(studentId: string): Promise<BadgeKey[]> {
  const supabase = createAdminClient();

  const [{ data: attempts }, { data: existing }] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("score, total, submitted_at")
      .eq("student_id", studentId),
    supabase.from("student_badges").select("badge").eq("student_id", studentId),
  ]);
  if (!attempts?.length) return [];

  const earned = badgesFromAttempts(
    {
      attempts: attempts.length,
      bestPercent: Math.max(...attempts.map((a) => Math.round((a.score / a.total) * 100))),
      days: [...new Set(attempts.map((a) => istDay(new Date(a.submitted_at))))],
    },
    istDay(new Date()),
  );

  const have = new Set(existing?.map((row) => row.badge));
  const fresh = earned.filter((badge) => !have.has(badge));
  if (fresh.length) {
    await supabase
      .from("student_badges")
      .upsert(
        fresh.map((badge) => ({ student_id: studentId, badge })),
        { onConflict: "student_id,badge", ignoreDuplicates: true },
      );
  }
  return fresh;
}

/** Awards "course_complete" once every lesson of the course is ticked off. */
export async function awardCourseBadge(studentId: string, lessonId: string) {
  const supabase = createAdminClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id);
  if (!lessons?.length) return;

  const { count } = await supabase
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .in("lesson_id", lessons.map((l) => l.id));

  if (count === lessons.length) {
    await supabase
      .from("student_badges")
      .upsert([{ student_id: studentId, badge: "course_complete" }], {
        onConflict: "student_id,badge",
        ignoreDuplicates: true,
      });
  }
}
