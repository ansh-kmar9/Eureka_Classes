/** Value stored for a question the student skipped. */
export const UNANSWERED = -1;

export interface Markable {
  correct: number;
}

/** Number of right answers. Works on the server (trusted) and on the device (offline preview). */
export function markAnswers(questions: Markable[], answers: number[]): number {
  return questions.reduce(
    (score, question, index) => score + (answers[index] === question.correct ? 1 : 0),
    0,
  );
}

/** True when `answers` is a usable answer sheet for a test with `questionCount` questions. */
export function isValidAnswerSheet(answers: unknown, questionCount: number): answers is number[] {
  return (
    Array.isArray(answers) &&
    answers.length === questionCount &&
    answers.every((a) => Number.isInteger(a) && a >= UNANSWERED && a <= 3)
  );
}
