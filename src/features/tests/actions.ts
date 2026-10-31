"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { getCurrentProfile } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { awardAttemptBadges } from "./badges";
import { parseQuestions } from "./import-parser";
import { isValidAnswerSheet, markAnswers } from "./marking";
import {
  attemptSubmissionSchema,
  importFormSchema,
  PRACTICE_QUESTION_COUNT,
  questionFormSchema,
} from "./schemas";

type Result = { ok: boolean };
const idSchema = z.uuid();

function refreshTests(testId?: string) {
  revalidatePath("/teacher/tests");
  revalidatePath("/tests", "layout");
  if (testId) revalidatePath(`/teacher/tests/${testId}`);
}

/* ------------------------------ Teacher actions ------------------------------ */

/** Creates the (single) practice test of a topic and returns its id. */
export async function createTest(topicId: string): Promise<Result & { id?: string }> {
  if (!idSchema.safeParse(topicId).success || !(await getStaff())) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_tests")
    .insert({ topic_id: topicId })
    .select("id")
    .single();

  refreshTests();
  // 23505: the topic already has a test; hand back the existing one.
  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("practice_tests")
      .select("id")
      .eq("topic_id", topicId)
      .maybeSingle();
    return existing ? { ok: true, id: existing.id } : { ok: false };
  }
  return error || !data ? { ok: false } : { ok: true, id: data.id };
}

export async function deleteTest(testId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(testId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("practice_tests").delete().eq("id", testId);

  refreshTests(testId);
  return { ok: !error };
}

/** Publishing needs exactly 20 questions; the database enforces it. */
export async function setTestPublished(testId: string, published: boolean): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(testId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("practice_tests")
    .update({ is_published: published })
    .eq("id", testId);

  refreshTests(testId);
  return { ok: !error };
}

async function nextPosition(testId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("position")
    .eq("test_id", testId)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? 0) + 1;
}

export async function addQuestion(testId: string, input: unknown): Promise<Result> {
  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(testId).success || !(await getStaff())) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("questions").insert({
    ...parsed.data,
    test_id: testId,
    position: await nextPosition(testId),
  });

  refreshTests(testId);
  return { ok: !error };
}

export async function deleteQuestion(questionId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(questionId).success) return { ok: false };

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("test_id")
    .eq("id", questionId)
    .maybeSingle();
  const { error } = await supabase.from("questions").delete().eq("id", questionId);

  refreshTests(question?.test_id);
  return { ok: !error };
}

export type ImportResult =
  | { ok: true; added: number }
  | { ok: false; reason: "empty" | "json" | "format" | "tooMany" | "generic"; position?: number };

/** Adds many questions at once from pasted text or JSON. All or nothing. */
export async function importQuestions(testId: string, input: unknown): Promise<ImportResult> {
  const form = importFormSchema.safeParse(input);
  if (!form.success || !idSchema.safeParse(testId).success || !(await getStaff())) {
    return { ok: false, reason: "generic" };
  }

  const parsed = parseQuestions(form.data.content);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);

  if ((count ?? 0) + parsed.questions.length > PRACTICE_QUESTION_COUNT) {
    return { ok: false, reason: "tooMany" };
  }

  const start = await nextPosition(testId);
  const { error } = await supabase.from("questions").insert(
    parsed.questions.map((q, index) => ({
      test_id: testId,
      position: start + index,
      text: q.text,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
    })),
  );

  refreshTests(testId);
  return error ? { ok: false, reason: "generic" } : { ok: true, added: parsed.questions.length };
}

/* ------------------------------ Student actions ------------------------------ */

export type SubmitResult =
  | { ok: true; attemptId: string; score: number; total: number }
  | { ok: false; error: "invalid" | "unauthorized" | "generic" };

/**
 * Marks a finished test on the server and stores the attempt. The browser only sends
 * its answers, never a score. Sending the same `clientId` twice is safe: the attempt
 * is stored once, which is what makes offline syncing and retries harmless.
 */
export async function submitPracticeAttempt(input: unknown): Promise<SubmitResult> {
  const parsed = attemptSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "student" || profile.status !== "approved") {
    return { ok: false, error: "unauthorized" };
  }

  const { testId, clientId, answers, durationSeconds, submittedAt } = parsed.data;

  // Reading through the student's own session means row-level security decides
  // whether this test is theirs to take (published, right class and stream).
  const session = await createClient();
  const { data: questions } = await session
    .from("questions")
    .select("correct")
    .eq("test_id", testId)
    .order("position")
    .order("created_at");

  if (!questions?.length || !isValidAnswerSheet(answers, questions.length)) {
    return { ok: false, error: "invalid" };
  }

  const admin = createAdminClient();

  const existing = await admin
    .from("practice_attempts")
    .select("id, score, total")
    .eq("student_id", profile.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (existing.data) {
    return { ok: true, attemptId: existing.data.id, score: existing.data.score, total: existing.data.total };
  }

  // A device clock can be wrong: never accept a finish time in the future or older than a month.
  const now = Date.now();
  const claimed = submittedAt ? Date.parse(submittedAt) : now;
  const finishedAt = new Date(Math.min(now, Math.max(claimed, now - 30 * 24 * 60 * 60 * 1000)));

  const score = markAnswers(questions, answers);
  const { data: attempt, error } = await admin
    .from("practice_attempts")
    .insert({
      student_id: profile.id,
      test_id: testId,
      answers,
      score,
      total: questions.length,
      duration_seconds: durationSeconds,
      client_id: clientId,
      submitted_at: finishedAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !attempt) return { ok: false, error: "generic" };

  try {
    await awardAttemptBadges(profile.id);
  } catch {
    // Badges are a bonus; the attempt is already saved.
  }

  revalidatePath("/tests", "layout");
  revalidatePath("/dashboard");
  return { ok: true, attemptId: attempt.id, score, total: questions.length };
}
