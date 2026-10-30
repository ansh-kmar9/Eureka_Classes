import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ScheduledAttempt,
  ScheduledTest,
} from "@/lib/supabase/types";
import { getPhase, type Phase } from "@/lib/schedule";
import { finalizeExpiredAttempts } from "./attempts";

/** A draft has no phase yet; once scheduled it is upcoming, live, ended or cancelled. */
export type TestPhase = Phase | "draft";

export const phaseOf = (test: ScheduledTest): TestPhase =>
  test.status === "draft" ? "draft" : getPhase(test, Date.now());

export interface ScheduledEntry {
  test: ScheduledTest;
  phase: TestPhase;
  /** The caller's attempt (students only). */
  attempt: ScheduledAttempt | null;
}

/** Tests visible to the caller. Teachers see every test; students see their class's scheduled ones. */
export async function listScheduledTests(options: {
  classFilter?: number | null;
  studentId?: string;
} = {}): Promise<ScheduledEntry[]> {
  // Close attempts whose time ran out before anyone reads their status.
  await finalizeExpiredAttempts(options.studentId ? { studentId: options.studentId } : {});

  const supabase = await createClient();
  let query = supabase
    .from("scheduled_tests")
    .select("*")
    .order("starts_at", { ascending: false });
  if (options.classFilter) query = query.eq("class", options.classFilter);

  const { data: tests } = await query;
  if (!tests?.length) return [];

  const attempts = new Map<string, ScheduledAttempt>();
  if (options.studentId) {
    const { data } = await supabase
      .from("scheduled_attempts")
      .select("*")
      .eq("student_id", options.studentId)
      .in("test_id", tests.map((t) => t.id));
    data?.forEach((a) => attempts.set(a.test_id, a));
  }

  return tests.map((test) => ({
    test,
    phase: phaseOf(test),
    attempt: attempts.get(test.id) ?? null,
  }));
}

export async function getScheduledTest(testId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();
  return data;
}

/** The student's own attempt at a test, with expired ones closed first. */
export async function getMyAttempt(testId: string, studentId: string) {
  await finalizeExpiredAttempts({ testId, studentId });
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .maybeSingle();
  return data;
}

/** Questions with their answer keys, for teachers only (row-level security refuses anyone else). */
export async function getQuestionsWithKeys(testId: string) {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("scheduled_questions")
    .select("*")
    .eq("test_id", testId)
    .order("position")
    .order("created_at");
  if (!questions?.length) return [];

  const { data: keys } = await supabase
    .from("scheduled_answer_keys")
    .select("question_id, correct")
    .in("question_id", questions.map((q) => q.id));
  const keyOf = new Map(keys?.map((k) => [k.question_id, k.correct]));

  return questions.map((question) => ({ ...question, correct: keyOf.get(question.id) ?? null }));
}

export interface ResultRow {
  attempt: ScheduledAttempt;
  student: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "board">;
}

/** Everyone who took the test, best score first, plus how many eligible students did not. */
export async function getScheduledResults(test: ScheduledTest) {
  await finalizeExpiredAttempts({ testId: test.id });
  const supabase = await createClient();

  const { data: attempts } = await supabase
    .from("scheduled_attempts")
    .select("*")
    .eq("test_id", test.id);

  const studentIds = attempts?.map((a) => a.student_id) ?? [];
  const { data: students } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, board")
        .in("id", studentIds)
    : { data: [] };
  const byId = new Map(students?.map((s) => [s.id, s]));

  const rows: ResultRow[] = (attempts ?? [])
    .map((attempt) => ({ attempt, student: byId.get(attempt.student_id) }))
    .filter((row): row is ResultRow => Boolean(row.student))
    .sort(
      (a, b) =>
        (b.attempt.score ?? -1) - (a.attempt.score ?? -1) ||
        // On equal scores, whoever finished first ranks higher.
        Date.parse(a.attempt.submitted_at ?? a.attempt.deadline_at) -
          Date.parse(b.attempt.submitted_at ?? b.attempt.deadline_at),
    );

  let eligible = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student")
    .eq("status", "approved")
    .eq("class", test.class);
  if (test.stream) eligible = eligible.eq("stream", test.stream);
  const { count } = await eligible;

  return { rows, eligible: count ?? 0 };
}
