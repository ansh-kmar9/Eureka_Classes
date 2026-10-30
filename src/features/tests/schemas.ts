import { z } from "zod";
import type { ValidationKey } from "@/features/profile/schemas";

const key = <K extends ValidationKey>(value: K) => value;

/** Every practice test has exactly this many questions. */
export const PRACTICE_QUESTION_COUNT = 20;

const optionField = z.string().trim().min(1, key("option")).max(300, key("option"));

export const questionFormSchema = z
  .object({
    text: z.string().trim().min(1, key("question")).max(1000, key("question")),
    option1: optionField,
    option2: optionField,
    option3: optionField,
    option4: optionField,
    correct: z.enum(["0", "1", "2", "3"], key("answer")),
    explanation: z.string().trim().max(1000, key("description")),
  })
  .transform((v) => ({
    text: v.text,
    options: [v.option1, v.option2, v.option3, v.option4],
    correct: Number(v.correct),
    explanation: v.explanation || null,
  }));

export const importFormSchema = z.object({
  content: z.string().trim().min(1, key("question")).max(60000, key("question")),
});

/** What the browser sends when a student finishes a test (online, or later from the offline queue). */
export const attemptSubmissionSchema = z.object({
  testId: z.uuid(),
  clientId: z.uuid(),
  answers: z.array(z.number().int().min(-1).max(3)).min(1).max(PRACTICE_QUESTION_COUNT),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60),
  /** When the student actually finished; matters for tests taken offline. */
  submittedAt: z.iso.datetime().optional(),
});

export type QuestionFormInput = z.input<typeof questionFormSchema>;
export type QuestionFormValues = z.output<typeof questionFormSchema>;
export type ImportFormInput = z.input<typeof importFormSchema>;
export type AttemptSubmission = z.infer<typeof attemptSubmissionSchema>;
