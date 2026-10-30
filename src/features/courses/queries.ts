import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/lib/supabase/types";

export interface CourseSummary {
  course: Course;
  subject: string;
  total: number;
  done: number;
}

/**
 * Courses the caller may see (row-level security does the class/stream filtering),
 * with lesson counts. Pass `studentId` to include that student's completed count.
 */
export async function getCourseSummaries(options: {
  classFilter?: number | null;
  studentId?: string;
} = {}): Promise<CourseSummary[]> {
  const supabase = await createClient();

  let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (options.classFilter) query = query.eq("class", options.classFilter);
  const { data: courses } = await query;
  if (!courses?.length) return [];

  const courseIds = courses.map((c) => c.id);
  const subjectIds = [...new Set(courses.map((c) => c.subject_id))];

  const [{ data: subjects }, { data: lessons }] = await Promise.all([
    supabase.from("subjects").select("id, name").in("id", subjectIds),
    supabase.from("lessons").select("id, course_id").in("course_id", courseIds),
  ]);

  const doneLessons = new Set<string>();
  if (options.studentId && lessons?.length) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", options.studentId)
      .in("lesson_id", lessons.map((l) => l.id));
    progress?.forEach((p) => doneLessons.add(p.lesson_id));
  }

  const subjectName = new Map(subjects?.map((s) => [s.id, s.name]));
  return courses.map((course) => {
    const own = lessons?.filter((l) => l.course_id === course.id) ?? [];
    return {
      course,
      subject: subjectName.get(course.subject_id) ?? "",
      total: own.length,
      done: own.filter((l) => doneLessons.has(l.id)).length,
    };
  });
}

export interface CourseDetail {
  course: Course;
  subject: string;
  lessons: Lesson[];
  completed: Set<string>;
}

export async function getCourseDetail(
  courseId: string,
  studentId?: string,
): Promise<CourseDetail | null> {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return null;

  const [{ data: subject }, { data: lessons }] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", course.subject_id).maybeSingle(),
    supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("position")
      .order("created_at"),
  ]);

  const completed = new Set<string>();
  if (studentId && lessons?.length) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .in("lesson_id", lessons.map((l) => l.id));
    progress?.forEach((p) => completed.add(p.lesson_id));
  }

  return { course, subject: subject?.name ?? "", lessons: lessons ?? [], completed };
}

export async function listSubjects(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("name").order("name");
  return data?.map((s) => s.name) ?? [];
}
