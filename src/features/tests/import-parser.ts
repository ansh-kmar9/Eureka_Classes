export interface ParsedQuestion {
  text: string;
  options: [string, string, string, string];
  /** Zero-based index of the right option. */
  correct: 0 | 1 | 2 | 3;
  explanation: string | null;
}

export type ParseResult =
  | { ok: true; questions: ParsedQuestion[] }
  | { ok: false; reason: "empty" | "json" | "format"; position?: number };

const LETTERS = ["a", "b", "c", "d"];
const MAX_TEXT = 1000;
const MAX_OPTION = 300;
const MAX_EXPLANATION = 1000;

function toIndex(value: unknown): 0 | 1 | 2 | 3 | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4) {
    return (value - 1) as 0 | 1 | 2 | 3;
  }
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase().replace(/[().]/g, "");
    const letter = LETTERS.indexOf(clean);
    if (letter >= 0) return letter as 0 | 1 | 2 | 3;
    if (/^[1-4]$/.test(clean)) return (Number(clean) - 1) as 0 | 1 | 2 | 3;
  }
  return null;
}

function build(
  text: unknown,
  options: unknown,
  answer: unknown,
  explanation: unknown,
): ParsedQuestion | null {
  if (typeof text !== "string" || !text.trim() || text.trim().length > MAX_TEXT) return null;
  if (!Array.isArray(options) || options.length !== 4) return null;
  const clean = options.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (clean.some((o) => !o || o.length > MAX_OPTION)) return null;
  const correct = toIndex(answer);
  if (correct === null) return null;
  const note = typeof explanation === "string" ? explanation.trim() : "";
  if (note.length > MAX_EXPLANATION) return null;

  return {
    text: text.trim(),
    options: clean as ParsedQuestion["options"],
    correct,
    explanation: note || null,
  };
}

function parseJson(input: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return { ok: false, reason: "json" };
  }
  if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: "json" };

  const questions: ParsedQuestion[] = [];
  for (const [index, item] of data.entries()) {
    const row = (item ?? {}) as Record<string, unknown>;
    const parsed = build(
      row.question ?? row.text,
      row.options,
      row.answer ?? row.correct,
      row.explanation,
    );
    if (!parsed) return { ok: false, reason: "format", position: index + 1 };
    questions.push(parsed);
  }
  return { ok: true, questions };
}

const QUESTION_PREFIX = /^(?:q(?:uestion)?\s*\d*\s*[.:)\]-]|\d+\s*[.)])\s*/i;
const OPTION_LINE = /^\(?([a-d])[).:]\s*(.*)$/i;
const ANSWER_LINE = /^(?:answer|ans|correct(?:\s+answer)?)\s*[:=-]\s*\(?([a-d1-4])\)?\b/i;
const EXPLANATION_LINE = /^(?:explanation|exp|solution)\s*[:=-]\s*(.*)$/i;

/** Plain text, one question per block, blocks separated by a blank line. */
function parseText(input: string): ParseResult {
  const blocks = input.split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) return { ok: false, reason: "empty" };

  const questions: ParsedQuestion[] = [];

  for (const [index, block] of blocks.entries()) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const questionLines: string[] = [];
    const options: string[] = [];
    let answer: string | null = null;
    let explanation = "";
    // Which field a continuation line belongs to.
    let current: "question" | "option" | "explanation" = "question";

    for (const line of lines) {
      const answerMatch = line.match(ANSWER_LINE);
      const explanationMatch = line.match(EXPLANATION_LINE);
      const optionMatch = line.match(OPTION_LINE);

      if (answerMatch) {
        answer = answerMatch[1];
      } else if (explanationMatch) {
        explanation = explanationMatch[1];
        current = "explanation";
      } else if (optionMatch && optionMatch[1].toLowerCase() === LETTERS[options.length]) {
        options.push(optionMatch[2]);
        current = "option";
      } else if (current === "question") {
        questionLines.push(line.replace(QUESTION_PREFIX, ""));
      } else if (current === "option") {
        options[options.length - 1] += ` ${line}`;
      } else {
        explanation += ` ${line}`;
      }
    }

    const parsed = build(questionLines.join(" "), options, answer, explanation);
    if (!parsed) return { ok: false, reason: "format", position: index + 1 };
    questions.push(parsed);
  }
  return { ok: true, questions };
}

/** Accepts a JSON array or the plain-text question format. */
export function parseQuestions(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  return trimmed.startsWith("[") ? parseJson(trimmed) : parseText(trimmed);
}
