/** The structured feedback Gemini returns for a practice test. */
export interface AiAnalysis {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  encouragement: string;
}

export const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    improvements: { type: "ARRAY", items: { type: "STRING" } },
    nextSteps: { type: "ARRAY", items: { type: "STRING" } },
    encouragement: { type: "STRING" },
  },
  required: ["summary", "strengths", "improvements", "nextSteps", "encouragement"],
} as const;

const clip = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const list = (value: unknown, max = 6) =>
  Array.isArray(value) ? value.map((item) => clip(item, 300)).filter(Boolean).slice(0, max) : [];

/** Checks a stored or freshly generated reply and returns it in a safe, trimmed shape (or null). */
export function parseAnalysis(raw: unknown): AiAnalysis | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const analysis: AiAnalysis = {
    summary: clip(record.summary, 600),
    strengths: list(record.strengths),
    improvements: list(record.improvements),
    nextSteps: list(record.nextSteps),
    encouragement: clip(record.encouragement, 400),
  };
  return analysis.summary ? analysis : null;
}

export interface AnalysisInput {
  language: "en" | "hi";
  board: string | null;
  classNumber: number | null;
  subject: string;
  topic: string;
  score: number;
  total: number;
  items: {
    question: string;
    options: string[];
    /** Index the student chose, or -1 if skipped. */
    chosen: number;
    correct: number;
    explanation: string | null;
  }[];
}

const LETTERS = ["A", "B", "C", "D"];

export function buildAnalysisSystem(language: "en" | "hi"): string {
  const write =
    language === "hi"
      ? "Write in simple, friendly Hindi (Devanagari). Keep subject terms in English where a student would know them that way."
      : "Write in simple, friendly English.";

  return [
    "You are Eureka, a warm and encouraging tutor for Indian school students (CBSE and BSEB boards).",
    "You will be given a student's practice test result. Analyse it and help the student improve.",
    write,
    "Be specific: refer to question numbers and the underlying concept. Use only the information given; do not invent facts or questions.",
    "Keep every point short, under 25 words. Give 2 to 4 points each for strengths, improvements and next steps.",
    "If the student got everything right, say so, and suggest how to go deeper. If they skipped questions, mention it kindly.",
    "Reply with JSON only, matching the schema.",
  ].join(" ");
}

/** The test as plain text for the model. Question text comes from teachers, so it is only ever data. */
export function buildAnalysisPrompt(input: AnalysisInput): string {
  const header = [
    `Board: ${input.board?.toUpperCase() ?? "unknown"}`,
    `Class: ${input.classNumber ?? "unknown"}`,
    `Subject: ${input.subject}`,
    `Topic: ${input.topic}`,
    `Score: ${input.score} out of ${input.total}`,
  ].join("\n");

  const questions = input.items
    .map((item, index) => {
      const options = item.options.map((option, i) => `${LETTERS[i]}) ${option}`).join("  ");
      const chosen = item.chosen < 0 ? "skipped" : LETTERS[item.chosen];
      const verdict = item.chosen === item.correct ? "CORRECT" : item.chosen < 0 ? "SKIPPED" : "WRONG";
      return [
        `Q${index + 1}: ${item.question}`,
        `Options: ${options}`,
        `Student answered: ${chosen}. Correct answer: ${LETTERS[item.correct]}. Result: ${verdict}.`,
        item.explanation ? `Explanation: ${item.explanation}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `${header}\n\n${questions}`;
}
