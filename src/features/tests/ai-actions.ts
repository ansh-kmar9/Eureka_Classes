"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { GeminiError, generateJson } from "@/lib/gemini/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ANALYSIS_SCHEMA,
  buildAnalysisPrompt,
  buildAnalysisSystem,
  parseAnalysis,
  type AiAnalysis,
} from "./analysis";
import { getAttempt, getQuestions, getTestDetail } from "./queries";

export type AnalyzeResult =
  | { ok: true; analysis: AiAnalysis }
  | { ok: false; error: "unauthorized" | "rateLimited" | "busy" | "unavailable" | "generic" };

/** Each student can request this many fresh analyses per hour (the free Gemini quota is shared). */
const HOURLY_LIMIT = 10;

/**
 * Writes personalised feedback for one practice attempt. Practice tests only: scheduled tests
 * have no analysis. The result is saved, so asking again for the same attempt costs nothing.
 */
export async function analyzeAttempt(attemptId: string): Promise<AnalyzeResult> {
  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.status !== "approved" ||
    !z.uuid().safeParse(attemptId).success
  ) {
    return { ok: false, error: "unauthorized" };
  }

  // Read through the student's own session, so only their own attempt can be found.
  const attempt = await getAttempt(attemptId, profile.id);
  if (!attempt) return { ok: false, error: "unauthorized" };

  const saved = parseAnalysis(attempt.ai_analysis);
  if (saved) return { ok: true, analysis: saved };

  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("practice_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", profile.id)
    .gte("ai_analyzed_at", since);
  if ((count ?? 0) >= HOURLY_LIMIT) return { ok: false, error: "rateLimited" };

  const detail = await getTestDetail(attempt.test_id);
  if (!detail) return { ok: false, error: "generic" };
  const questions = await getQuestions(attempt.test_id);
  if (questions.length === 0) return { ok: false, error: "generic" };

  const language = (await getLocale()) === "hi" ? "hi" : "en";

  try {
    const raw = await generateJson<unknown>({
      system: buildAnalysisSystem(language),
      prompt: buildAnalysisPrompt({
        language,
        board: detail.subject.board,
        classNumber: detail.subject.class,
        subject: detail.subject.name,
        topic: detail.topic.name,
        score: attempt.score,
        total: attempt.total,
        items: questions.map((question, index) => ({
          question: question.text,
          options: question.options,
          chosen: attempt.answers[index] ?? -1,
          correct: question.correct,
          explanation: question.explanation,
        })),
      }),
      schema: ANALYSIS_SCHEMA,
      maxOutputTokens: 1500,
    });

    const analysis = parseAnalysis(raw);
    if (!analysis) return { ok: false, error: "generic" };

    await admin
      .from("practice_attempts")
      .update({ ai_analysis: JSON.stringify(analysis), ai_analyzed_at: new Date().toISOString() })
      .eq("id", attemptId)
      .eq("student_id", profile.id);

    return { ok: true, analysis };
  } catch (error) {
    // Logged for the developer; the student only sees a friendly message.
    console.error("AI analysis failed:", error instanceof Error ? error.message : error);
    if (error instanceof GeminiError) {
      if (error.kind === "not_configured") return { ok: false, error: "unavailable" };
      if (error.kind === "busy") return { ok: false, error: "busy" };
    }
    return { ok: false, error: "generic" };
  }
}
