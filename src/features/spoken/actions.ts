"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { istDay } from "@/lib/badges";
import { getLessonRef, nextLessonId } from "@/lib/spoken/course";
import {
  levelFromXp,
  PASS_PERCENT,
  percentOf,
  starsFor,
  xpForLesson,
  xpForPractice,
} from "@/lib/spoken/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardSpokenBadges } from "./badges";
import { getSpokenState, unlockedIds } from "./queries";

const lessonResultSchema = z
  .object({
    lessonId: z.string().regex(/^\d{1,2}-\d{1,2}-\d{1,2}$/),
    correct: z.number().int().min(0).max(12),
    total: z.number().int().min(4).max(12),
  })
  .refine((v) => v.correct <= v.total);

const practiceResultSchema = z
  .object({
    correct: z.number().int().min(0).max(20),
    total: z.number().int().min(5).max(20),
  })
  .refine((v) => v.correct <= v.total);

async function approvedStudent() {
  const profile = await getCurrentProfile();
  return profile && profile.role === "student" && profile.status === "approved" ? profile : null;
}

export type LessonOutcome =
  | {
      ok: true;
      passed: boolean;
      percent: number;
      stars: number;
      xp: number;
      firstTime: boolean;
      leveledUp: boolean;
      level: number;
      nextLessonId: string | null;
    }
  | { ok: false; error: "invalid" | "locked" | "generic" };

/**
 * Records a finished lesson. The browser only reports how many quiz questions were right;
 * the stars and XP are worked out here, and a lesson can only be finished once it is unlocked.
 */
export async function completeLesson(input: unknown): Promise<LessonOutcome> {
  const parsed = lessonResultSchema.safeParse(input);
  const profile = await approvedStudent();
  if (!parsed.success || !profile) return { ok: false, error: "invalid" };

  const { lessonId, correct, total } = parsed.data;
  if (!getLessonRef(lessonId)) return { ok: false, error: "invalid" };

  const before = await getSpokenState(profile.id);
  if (!unlockedIds(before.stars).has(lessonId)) return { ok: false, error: "locked" };

  const percent = percentOf(correct, total);
  const nextId = nextLessonId(lessonId);

  // Under the pass mark nothing is saved: the student simply tries again.
  if (percent < PASS_PERCENT) {
    return {
      ok: true,
      passed: false,
      percent,
      stars: 0,
      xp: 0,
      firstTime: false,
      leveledUp: false,
      level: before.level.level,
      nextLessonId: null,
    };
  }

  const firstTime = !before.stars.has(lessonId);
  const stars = starsFor(percent);
  const xp = xpForLesson(correct, total, firstTime);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("spoken_progress")
    .select("stars, best_percent, attempts")
    .eq("student_id", profile.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const saved = existing
    ? await admin
        .from("spoken_progress")
        .update({
          // A replay can only improve the result, never lower it.
          stars: Math.max(existing.stars, stars),
          best_percent: Math.max(existing.best_percent, percent),
          attempts: existing.attempts + 1,
          last_completed_at: new Date().toISOString(),
        })
        .eq("student_id", profile.id)
        .eq("lesson_id", lessonId)
    : await admin
        .from("spoken_progress")
        .insert({ student_id: profile.id, lesson_id: lessonId, stars, best_percent: percent });
  if (saved.error) return { ok: false, error: "generic" };

  await admin.from("spoken_activity").insert({
    student_id: profile.id,
    kind: "lesson",
    ref: lessonId,
    xp,
    day: istDay(new Date()),
  });

  try {
    await awardSpokenBadges(profile.id);
  } catch {
    // Badges are a bonus; the lesson is already saved.
  }

  revalidatePath("/spoken-english");
  revalidatePath("/dashboard");

  const after = levelFromXp(before.xp + xp).level;
  return {
    ok: true,
    passed: true,
    percent,
    stars,
    xp,
    firstTime,
    leveledUp: after > before.level.level,
    level: after,
    nextLessonId: nextId,
  };
}

export type PracticeOutcome =
  | { ok: true; xp: number; percent: number }
  | { ok: false; error: "invalid" | "locked" | "generic" };

/** Records a daily practice round. Only the first one each day earns XP. */
export async function completePractice(input: unknown): Promise<PracticeOutcome> {
  const parsed = practiceResultSchema.safeParse(input);
  const profile = await approvedStudent();
  if (!parsed.success || !profile) return { ok: false, error: "invalid" };

  const { correct, total } = parsed.data;
  const before = await getSpokenState(profile.id);
  // Practice reviews finished lessons, so at least one must be done.
  if (before.stars.size === 0) return { ok: false, error: "locked" };

  const percent = percentOf(correct, total);
  const xp = xpForPractice(correct, total, !before.practicedToday);

  if (xp > 0) {
    const { error } = await createAdminClient().from("spoken_activity").insert({
      student_id: profile.id,
      kind: "practice",
      ref: null,
      xp,
      day: istDay(new Date()),
    });
    if (error) return { ok: false, error: "generic" };

    try {
      await awardSpokenBadges(profile.id);
    } catch {
      // Badges are a bonus.
    }
    revalidatePath("/spoken-english");
  }
  return { ok: true, xp, percent };
}
