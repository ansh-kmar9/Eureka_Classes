import "server-only";
import { markAnswers, UNANSWERED } from "@/features/tests/marking";
import { MAX_STRIKES } from "@/lib/schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScheduledAttempt } from "@/lib/supabase/types";

/** How an attempt ended. Stored so teachers can see why a test was handed in. */
export type SubmitReason =
  | "manual"
  | "time"
  | "fullscreen_exit"
  | "navigation"
  | "strikes"
  | "expired";

/** A slow network may deliver the final answers a moment after the deadline. */
const GRACE_MS = 10_000;

export interface RunnerQuestion {
  id: string;
  text: string;
  options: string[];
}

async function orderedQuestionIds(testId: string) {
  const { data } = await createAdminClient()
    .from("scheduled_questions")
    .select("id")
    .eq("test_id", testId)
    .order("position")
    .order("created_at");
  return data?.map((q) => q.id) ?? [];
}

/** Questions as students see them: text and options only, never the answer key. */
export async function loadRunnerQuestions(testId: string): Promise<RunnerQuestion[]> {
  const { data } = await createAdminClient()
    .from("scheduled_questions")
    .select("id, text, options")
    .eq("test_id", testId)
    .order("position")
    .order("created_at");
  return data ?? [];
}

/** Makes an answer sheet the right length, with anything invalid counted as unanswered. */
export function normalizeAnswers(raw: unknown, length: number): number[] {
  const source = Array.isArray(raw) ? raw : [];
  return Array.from({ length }, (_, i) => {
    const value = source[i];
    return Number.isInteger(value) && value >= 0 && value <= 3 ? (value as number) : UNANSWERED;
  });
}

/**
 * Marks and closes an attempt. Safe to call more than once and from several places at once
 * (the student's phone, the deadline sweep): only the first call changes anything.
 *
 * `clientAnswers` are the student's final answers; they are used only if they arrive in time,
 * otherwise the answers last saved on the server are marked.
 */
export async function finalizeAttempt(
  attemptId: string,
  reason: SubmitReason,
  clientAnswers?: unknown,
): Promise<ScheduledAttempt | null> {
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("scheduled_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) return null;
  if (attempt.status === "submitted") return attempt;

  const ids = await orderedQuestionIds(attempt.test_id);
  const { data: keys } = ids.length
    ? await admin.from("scheduled_answer_keys").select("question_id, correct").in("question_id", ids)
    : { data: [] };
  const keyOf = new Map(keys?.map((k) => [k.question_id, k.correct]));
  // A question with no key can never be marked right.
  const sheet = ids.map((id) => ({ correct: keyOf.get(id) ?? -2 }));

  const now = Date.now();
  const deadline = Date.parse(attempt.deadline_at);
  const onTime = clientAnswers !== undefined && now <= deadline + GRACE_MS;
  const answers = normalizeAnswers(onTime ? clientAnswers : attempt.answers, ids.length);

  const { data: updated } = await admin
    .from("scheduled_attempts")
    .update({
      status: "submitted",
      answers,
      score: markAnswers(sheet, answers),
      total: ids.length,
      // Never later than the deadline, even if the sweep only ran afterwards.
      submitted_at: new Date(Math.min(now, deadline)).toISOString(),
      submit_reason: reason,
    })
    // The condition makes this a no-op if another call already closed the attempt.
    .eq("id", attemptId)
    .eq("status", "in_progress")
    .select("*")
    .maybeSingle();

  if (updated) return updated;

  const { data: current } = await admin
    .from("scheduled_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  return current;
}

/** Closes every attempt whose deadline has passed (students who never pressed submit). */
export async function finalizeExpiredAttempts(filter: { testId?: string; studentId?: string } = {}) {
  let query = createAdminClient()
    .from("scheduled_attempts")
    .select("id")
    .eq("status", "in_progress")
    .lt("deadline_at", new Date().toISOString());
  if (filter.testId) query = query.eq("test_id", filter.testId);
  if (filter.studentId) query = query.eq("student_id", filter.studentId);

  const { data } = await query;
  await Promise.all((data ?? []).map((row) => finalizeAttempt(row.id, "expired")));
}

/** Counts one "left the app" warning; the third one ends the test. */
export async function recordStrike(attemptId: string): Promise<ScheduledAttempt | null> {
  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("scheduled_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.status === "submitted") return attempt;

  if (Date.now() > Date.parse(attempt.deadline_at)) return finalizeAttempt(attemptId, "expired");

  const strikes = attempt.strikes + 1;
  await admin
    .from("scheduled_attempts")
    .update({ strikes })
    .eq("id", attemptId)
    .eq("status", "in_progress");

  if (strikes >= MAX_STRIKES) return finalizeAttempt(attemptId, "strikes");
  return { ...attempt, strikes };
}
