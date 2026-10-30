"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { getCurrentProfile } from "@/features/auth/queries";
import { parseQuestions } from "@/features/tests/import-parser";
import { importFormSchema, questionFormSchema } from "@/features/tests/schemas";
import { getPhase } from "@/lib/schedule";
import { pushMessages } from "@/lib/push/messages";
import { sendPushToStudents } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  finalizeAttempt,
  finalizeExpiredAttempts,
  loadRunnerQuestions,
  normalizeAnswers,
  type RunnerQuestion,
  type SubmitReason,
} from "./attempts";
import {
  answersSchema,
  MAX_SCHEDULED_QUESTIONS,
  scheduledTestFormSchema,
} from "./schemas";

type Result = { ok: boolean };
const idSchema = z.uuid();

function refreshScheduled(testId?: string) {
  revalidatePath("/teacher/tests/scheduled");
  revalidatePath("/tests/scheduled");
  if (testId) {
    revalidatePath(`/teacher/tests/scheduled/${testId}`);
    revalidatePath(`/tests/scheduled/${testId}`);
  }
}

/* ------------------------------ Teacher actions ------------------------------ */

export async function createScheduledTest(input: unknown): Promise<Result & { id?: string }> {
  const parsed = scheduledTestFormSchema.safeParse(input);
  if (!parsed.success || !(await getStaff())) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduled_tests")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) return { ok: false };

  refreshScheduled();
  return { ok: true, id: data.id };
}

async function nextPosition(testId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_questions")
    .select("position")
    .eq("test_id", testId)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? 0) + 1;
}

export async function addScheduledQuestion(testId: string, input: unknown): Promise<Result> {
  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(testId).success || !(await getStaff())) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("scheduled_questions")
    .insert({
      test_id: testId,
      text: parsed.data.text,
      options: parsed.data.options,
      position: await nextPosition(testId),
    })
    .select("id")
    .single();
  if (error || !question) return { ok: false };

  const { error: keyError } = await supabase
    .from("scheduled_answer_keys")
    .insert({ question_id: question.id, correct: parsed.data.correct });
  if (keyError) {
    // Never leave a question without its key.
    await supabase.from("scheduled_questions").delete().eq("id", question.id);
    return { ok: false };
  }

  refreshScheduled(testId);
  return { ok: true };
}

export async function deleteScheduledQuestion(questionId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(questionId).success) return { ok: false };

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("scheduled_questions")
    .select("test_id")
    .eq("id", questionId)
    .maybeSingle();
  const { error } = await supabase.from("scheduled_questions").delete().eq("id", questionId);

  refreshScheduled(question?.test_id);
  return { ok: !error };
}

export type ScheduledImportResult =
  | { ok: true; added: number }
  | { ok: false; reason: "empty" | "json" | "format" | "tooMany" | "generic"; position?: number };

export async function importScheduledQuestions(
  testId: string,
  input: unknown,
): Promise<ScheduledImportResult> {
  const form = importFormSchema.safeParse(input);
  if (!form.success || !idSchema.safeParse(testId).success || !(await getStaff())) {
    return { ok: false, reason: "generic" };
  }

  const parsed = parseQuestions(form.data.content);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { count } = await supabase
    .from("scheduled_questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);
  if ((count ?? 0) + parsed.questions.length > MAX_SCHEDULED_QUESTIONS) {
    return { ok: false, reason: "tooMany" };
  }

  const start = await nextPosition(testId);
  const { data: inserted, error } = await supabase
    .from("scheduled_questions")
    .insert(
      parsed.questions.map((q, index) => ({
        test_id: testId,
        text: q.text,
        options: q.options,
        position: start + index,
      })),
    )
    .select("id, position");
  if (error || !inserted) return { ok: false, reason: "generic" };

  // Insert order is not guaranteed to match, so keys are matched by position.
  const byPosition = new Map(inserted.map((row) => [row.position, row.id]));
  const keys = parsed.questions.map((q, index) => ({
    question_id: byPosition.get(start + index)!,
    correct: q.correct,
  }));
  const { error: keyError } = await supabase.from("scheduled_answer_keys").insert(keys);
  if (keyError) {
    await supabase.from("scheduled_questions").delete().in("id", inserted.map((r) => r.id));
    return { ok: false, reason: "generic" };
  }

  refreshScheduled(testId);
  return { ok: true, added: parsed.questions.length };
}

/** Opens the test to students: locks the questions and notifies the class. */
export async function publishScheduledTest(testId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(testId).success) return { ok: false };

  const supabase = await createClient();
  // The database refuses this unless there are questions and the start time is still ahead.
  const { data: test, error } = await supabase
    .from("scheduled_tests")
    .update({ status: "scheduled" })
    .eq("id", testId)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (error || !test) return { ok: false };

  await sendPushToStudents(
    (locale) =>
      pushMessages.testScheduled(locale, {
        title: test.title,
        startsAt: test.starts_at,
        minutes: test.duration_minutes,
      }),
    { class: test.class, stream: test.stream },
  );

  refreshScheduled(testId);
  return { ok: true };
}

export async function cancelScheduledTest(testId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(testId).success) return { ok: false };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("scheduled_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();
  if (!before || before.status === "cancelled") return { ok: false };

  const { error } = await supabase
    .from("scheduled_tests")
    .update({ status: "cancelled" })
    .eq("id", testId);
  if (error) return { ok: false };

  // Students only knew about it if it had been scheduled.
  if (before.status === "scheduled") {
    await sendPushToStudents((locale) => pushMessages.testCancelled(locale, { title: before.title }), {
      class: before.class,
      stream: before.stream,
    });
  }

  refreshScheduled(testId);
  return { ok: true };
}

/** Only drafts and cancelled tests can be deleted: a held test keeps its results. */
export async function deleteScheduledTest(testId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(testId).success) return { ok: false };

  const supabase = await createClient();
  const { data: test } = await supabase
    .from("scheduled_tests")
    .select("status")
    .eq("id", testId)
    .maybeSingle();
  if (!test || test.status === "scheduled") return { ok: false };

  const { error } = await supabase.from("scheduled_tests").delete().eq("id", testId);

  refreshScheduled(testId);
  return { ok: !error };
}

/* ------------------------------ Student actions ------------------------------ */

export type StartResult =
  | {
      ok: true;
      attemptId: string;
      deadlineAt: string;
      strikes: number;
      answers: number[];
      questions: RunnerQuestion[];
      serverNow: string;
    }
  | { ok: false; error: "unauthorized" | "notLive" | "already" | "generic" };

/**
 * Begins (or resumes) the student's single attempt. The deadline is the end of the test
 * window, so someone who joins late gets only the time that is left.
 */
export async function startScheduledAttempt(testId: string): Promise<StartResult> {
  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.status !== "approved" ||
    !idSchema.safeParse(testId).success
  ) {
    return { ok: false, error: "unauthorized" };
  }

  // The student's own session decides whether this test is theirs (class and stream).
  const session = await createClient();
  const { data: test } = await session
    .from("scheduled_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return { ok: false, error: "unauthorized" };

  const admin = createAdminClient();
  const now = Date.now();

  const { data: existing } = await admin
    .from("scheduled_attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", profile.id)
    .maybeSingle();

  let attempt = existing;
  if (attempt) {
    // Resuming is allowed only while time remains; otherwise it is closed and final.
    if (attempt.status === "submitted") return { ok: false, error: "already" };
    if (now >= Date.parse(attempt.deadline_at)) {
      await finalizeAttempt(attempt.id, "expired");
      return { ok: false, error: "already" };
    }
  } else {
    if (getPhase(test, now) !== "live") return { ok: false, error: "notLive" };

    const { data: created, error } = await admin
      .from("scheduled_attempts")
      .insert({
        test_id: testId,
        student_id: profile.id,
        deadline_at: new Date(Date.parse(test.starts_at) + test.duration_minutes * 60_000).toISOString(),
      })
      .select("*")
      .single();

    if (error?.code === "23505") {
      // Two taps at once: the other request created it first.
      const { data: raced } = await admin
        .from("scheduled_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("student_id", profile.id)
        .maybeSingle();
      attempt = raced;
    } else {
      attempt = created;
    }
  }
  if (!attempt) return { ok: false, error: "generic" };

  const questions = await loadRunnerQuestions(testId);
  refreshScheduled(testId);
  return {
    ok: true,
    attemptId: attempt.id,
    deadlineAt: attempt.deadline_at,
    strikes: attempt.strikes,
    answers: normalizeAnswers(attempt.answers, questions.length),
    questions,
    serverNow: new Date().toISOString(),
  };
}

export type ProgressResult =
  | { status: "in_progress"; strikes: number; deadlineAt: string; serverNow: string }
  | { status: "submitted" }
  | { status: "error" };

async function ownedAttempt(attemptId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "student" || !idSchema.safeParse(attemptId).success) return null;

  const { data } = await createAdminClient()
    .from("scheduled_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", profile.id)
    .maybeSingle();
  return data;
}

/** Saves answers as the student goes, and reports the warnings and clock back (a heartbeat). */
export async function saveScheduledAnswers(
  attemptId: string,
  answers: unknown,
): Promise<ProgressResult> {
  const parsed = answersSchema.safeParse(answers);
  const attempt = await ownedAttempt(attemptId);
  if (!parsed.success || !attempt) return { status: "error" };
  if (attempt.status === "submitted") return { status: "submitted" };

  // Past the deadline the attempt is closed with whatever was saved before it.
  if (Date.now() > Date.parse(attempt.deadline_at)) {
    await finalizeAttempt(attemptId, "expired");
    return { status: "submitted" };
  }

  await createAdminClient()
    .from("scheduled_attempts")
    .update({ answers: parsed.data })
    .eq("id", attemptId)
    .eq("status", "in_progress");

  return {
    status: "in_progress",
    strikes: attempt.strikes,
    deadlineAt: attempt.deadline_at,
    serverNow: new Date().toISOString(),
  };
}

const clientReasons = ["manual", "time", "fullscreen_exit", "navigation"] as const;

/** Hands in the test. Called on the button, when time runs out, or when the student leaves. */
export async function submitScheduledAttempt(
  attemptId: string,
  answers: unknown,
  reason: string,
): Promise<Result> {
  const attempt = await ownedAttempt(attemptId);
  if (!attempt) return { ok: false };

  const safeReason = (clientReasons as readonly string[]).includes(reason)
    ? (reason as SubmitReason)
    : "manual";
  const done = await finalizeAttempt(attemptId, safeReason, answers);

  refreshScheduled(attempt.test_id);
  revalidatePath("/dashboard");
  return { ok: Boolean(done) };
}

/** Closes expired attempts of the signed-in student, so lists never show stale "in progress". */
export async function sweepMyExpiredAttempts() {
  const profile = await getCurrentProfile();
  if (profile?.role === "student") await finalizeExpiredAttempts({ studentId: profile.id });
}
