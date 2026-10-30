"use server";

import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { getQuestions, getTestDetail } from "./queries";

export type OfflineTestPayload =
  | {
      ok: true;
      test: {
        id: string;
        topic: string;
        subject: string;
        durationMinutes: number;
        questions: {
          id: string;
          text: string;
          options: string[];
          correct: number;
          explanation: string | null;
        }[];
      };
    }
  | { ok: false };

/**
 * Everything needed to take a practice test without internet, answers included, so the phone
 * can mark it on the spot. The student's own session decides whether the test is theirs.
 */
export async function getOfflineTest(testId: string): Promise<OfflineTestPayload> {
  const profile = await getCurrentProfile();
  if (
    !profile ||
    profile.role !== "student" ||
    profile.status !== "approved" ||
    !z.uuid().safeParse(testId).success
  ) {
    return { ok: false };
  }

  const detail = await getTestDetail(testId);
  if (!detail || !detail.test.is_published) return { ok: false };

  const questions = await getQuestions(testId);
  if (questions.length === 0) return { ok: false };

  return {
    ok: true,
    test: {
      id: testId,
      topic: detail.topic.name,
      subject: detail.subject.name,
      durationMinutes: detail.test.duration_minutes,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      })),
    },
  };
}
