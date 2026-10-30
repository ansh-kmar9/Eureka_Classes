"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { getStaff } from "@/features/auth/guards";
import { courseFormSchema, lessonFormSchema } from "@/features/content/schemas";
import { resolveSubjectId } from "@/features/content/subjects";
import { awardCourseBadge } from "@/features/tests/badges";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean };
const idSchema = z.uuid();

function refreshContent(courseId?: string) {
  revalidatePath("/teacher/content/courses");
  revalidatePath("/courses");
  if (courseId) {
    revalidatePath(`/teacher/content/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}`, "layout");
  }
}

export async function createCourse(input: unknown): Promise<Result & { id?: string }> {
  const parsed = courseFormSchema.safeParse(input);
  if (!parsed.success || !(await getStaff())) return { ok: false };

  const supabase = await createClient();
  const { subject, ...course } = parsed.data;
  const subjectId = await resolveSubjectId(supabase, subject);
  if (!subjectId) return { ok: false };

  const { data, error } = await supabase
    .from("courses")
    .insert({ ...course, subject_id: subjectId })
    .select("id")
    .single();
  if (error || !data) return { ok: false };

  refreshContent();
  return { ok: true, id: data.id };
}

export async function deleteCourse(courseId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(courseId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  refreshContent(courseId);
  return { ok: !error };
}

export async function addLesson(courseId: string, input: unknown): Promise<Result> {
  const parsed = lessonFormSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(courseId).success || !(await getStaff())) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("lessons")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);

  const { error } = await supabase.from("lessons").insert({
    ...parsed.data,
    course_id: courseId,
    position: (last?.[0]?.position ?? 0) + 1,
  });

  refreshContent(courseId);
  return { ok: !error };
}

export async function deleteLesson(lessonId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(lessonId).success) return { ok: false };

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  refreshContent(lesson?.course_id);
  return { ok: !error };
}

/** Swaps a lesson with its neighbour, then renumbers so positions stay tidy. */
export async function moveLesson(lessonId: string, direction: "up" | "down"): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(lessonId).success) return { ok: false };

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return { ok: false };

  const { data: siblings } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id)
    .order("position")
    .order("created_at");
  const ids = siblings?.map((row) => row.id) ?? [];

  const from = ids.indexOf(lessonId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { ok: true };

  [ids[from], ids[to]] = [ids[to], ids[from]];
  const results = await Promise.all(
    ids.map((id, index) => supabase.from("lessons").update({ position: index + 1 }).eq("id", id)),
  );

  refreshContent(lesson.course_id);
  return { ok: results.every((r) => !r.error) };
}

/** A student ticks a lesson off (or un-ticks it). */
export async function setLessonComplete(
  lessonId: string,
  completed: boolean,
): Promise<Result> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "student" || !idSchema.safeParse(lessonId).success) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = completed
    ? await supabase
        .from("lesson_progress")
        .upsert({ lesson_id: lessonId }, { onConflict: "student_id,lesson_id", ignoreDuplicates: true })
    : await supabase
        .from("lesson_progress")
        .delete()
        .eq("lesson_id", lessonId)
        .eq("student_id", profile.id);

  if (!error && completed) {
    try {
      await awardCourseBadge(profile.id, lessonId);
    } catch {
      // A badge is a bonus; never fail the lesson tick because of it.
    }
  }

  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
  return { ok: !error };
}
