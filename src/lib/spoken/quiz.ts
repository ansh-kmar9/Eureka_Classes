import type { Phrase } from "./course";

/** Random number source, so tests can be repeatable. */
export type Rng = () => number;

export type QuizQuestion =
  | {
      kind: "meaning";
      /** An English phrase; the student picks its Hindi meaning. */
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      kind: "translate";
      /** A Hindi sentence; the student picks the English phrase. */
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      kind: "listen";
      /** The English phrase that is spoken aloud; the student picks what they heard. */
      audio: string;
      options: string[];
      answer: number;
    }
  | {
      kind: "arrange";
      /** A Hindi sentence; the student puts the English words in order. */
      prompt: string;
      /** The words, already shuffled. */
      words: string[];
      solution: string;
    };

export type QuizResponse = number | string[];

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Lower case, no punctuation, single spaces: so "Hello!" and "hello" compare equal. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Picks the right answer plus up to three different wrong ones, in random order. */
function pickOptions(
  correct: string,
  candidates: string[],
  rng: Rng,
): { options: string[]; answer: number } {
  const wrong = shuffle(
    [...new Set(candidates)].filter((candidate) => candidate !== correct),
    rng,
  ).slice(0, 3);
  const options = shuffle([correct, ...wrong], rng);
  return { options, answer: options.indexOf(correct) };
}

type Kind = QuizQuestion["kind"];

function build(
  kind: Kind,
  phrase: Phrase,
  pool: Phrase[],
  rng: Rng,
): QuizQuestion {
  switch (kind) {
    case "meaning": {
      const { options, answer } = pickOptions(phrase.hi, pool.map((p) => p.hi), rng);
      return { kind, prompt: phrase.en, options, answer };
    }
    case "translate": {
      const { options, answer } = pickOptions(phrase.en, pool.map((p) => p.en), rng);
      return { kind, prompt: phrase.hi, options, answer };
    }
    case "listen": {
      const { options, answer } = pickOptions(phrase.en, pool.map((p) => p.en), rng);
      return { kind, audio: phrase.en, options, answer };
    }
    case "arrange":
      return { kind, prompt: phrase.hi, words: shuffle(words(phrase.en), rng), solution: phrase.en };
  }
}

export interface QuizOptions {
  /** Listening questions need speech output; leave them out where the device has none. */
  allowListen?: boolean;
  /** How many questions to make. Defaults to one per phrase. */
  count?: number;
  rng?: Rng;
}

/**
 * Builds a quiz from phrases. Question types are mixed so the student meets each phrase in
 * different ways: reading its meaning, hearing it, translating it, and building it word by word.
 */
export function buildQuiz(target: Phrase[], pool: Phrase[], options: QuizOptions = {}): QuizQuestion[] {
  const rng = options.rng ?? Math.random;
  const kinds: Kind[] = options.allowListen === false
    ? ["meaning", "arrange", "translate"]
    : ["meaning", "listen", "arrange", "translate"];

  // Wrong answers come from the wider pool, so they are plausible but clearly different.
  const distractors = pool.length >= 4 ? pool : [...pool, ...target];
  const phrases = shuffle(target, rng).slice(0, options.count ?? target.length);
  const offset = Math.floor(rng() * kinds.length);

  return phrases.map((phrase, index) => {
    let kind = kinds[(index + offset) % kinds.length];
    // A sentence that is very short or very long makes a poor word puzzle.
    const count = words(phrase.en).length;
    if (kind === "arrange" && (count < 3 || count > 9)) kind = "translate";
    return build(kind, phrase, distractors, rng);
  });
}

export function isCorrect(question: QuizQuestion, response: QuizResponse): boolean {
  if (question.kind === "arrange") {
    return (
      Array.isArray(response) && normalize(response.join(" ")) === normalize(question.solution)
    );
  }
  return response === question.answer;
}

/* --------------------------- Speaking practice --------------------------- */

/** True if two words are the same, or one letter apart for longer words (speech recognition slips). */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;

  // One substitution, insertion or deletion is close enough.
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (short.length === long.length) i += 1;
      j += 1;
    }
  }
  return edits + (long.length - j) + (short.length - i) <= 1;
}

/**
 * How well what the phone heard matches the phrase, from 0 to 100.
 * Word order is ignored on purpose: this checks pronunciation, not memory.
 * `heard` holds the recogniser's alternatives; the best one counts.
 */
export function speechScore(target: string, heard: string[]): number {
  const wanted = words(normalize(target));
  if (wanted.length === 0) return 0;

  let best = 0;
  for (const transcript of heard) {
    const spoken = words(normalize(transcript));
    const available = [...spoken];
    let matched = 0;
    for (const word of wanted) {
      const at = available.findIndex((candidate) => sameWord(word, candidate));
      if (at >= 0) {
        matched += 1;
        available.splice(at, 1);
      }
    }
    best = Math.max(best, Math.round((matched / wanted.length) * 100));
  }
  return best;
}

export const SPEAKING_GOOD = 75;
export const SPEAKING_CLOSE = 45;
