import "server-only";
import { currentStreak, istDay } from "@/lib/badges";
import { LESSONS } from "@/lib/spoken/course";
import { levelFromXp, type LevelInfo } from "@/lib/spoken/progress";
import { createClient } from "@/lib/supabase/server";

export interface SpokenState {
  /** Stars earned per finished lesson, by lesson id. */
  stars: Map<string, number>;
  xp: number;
  level: LevelInfo;
  /** Consecutive days with some Spoken English activity, ending today or yesterday. */
  streak: number;
  /** True if the student already did something today (so the streak is safe). */
  activeToday: boolean;
  practicedToday: boolean;
}

/** Lesson ids in course order that this student may open: finished ones, plus the next one. */
export function unlockedIds(stars: Map<string, number>): Set<string> {
  const open = new Set<string>();
  for (const { lesson } of LESSONS) {
    open.add(lesson.id);
    // The first lesson not yet finished is the last one that opens.
    if (!stars.has(lesson.id)) break;
  }
  return open;
}

export async function getSpokenState(studentId: string): Promise<SpokenState> {
  const supabase = await createClient();

  const [{ data: progress }, { data: activity }] = await Promise.all([
    supabase.from("spoken_progress").select("lesson_id, stars").eq("student_id", studentId),
    supabase.from("spoken_activity").select("kind, xp, day").eq("student_id", studentId),
  ]);

  const stars = new Map(progress?.map((row) => [row.lesson_id, row.stars]));
  const rows = activity ?? [];
  const xp = rows.reduce((sum, row) => sum + row.xp, 0);
  const days = [...new Set(rows.map((row) => row.day))];
  const today = istDay(new Date());

  return {
    stars,
    xp,
    level: levelFromXp(xp),
    streak: currentStreak(days, today),
    activeToday: days.includes(today),
    practicedToday: rows.some((row) => row.kind === "practice" && row.day === today),
  };
}
