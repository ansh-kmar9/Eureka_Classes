/** A lesson is passed with at least this percentage of the quiz right. */
export const PASS_PERCENT = 60;

export function percentOf(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/** One to three stars for how well the quiz went. */
export function starsFor(percent: number): 1 | 2 | 3 {
  if (percent >= 90) return 3;
  if (percent >= 75) return 2;
  return 1;
}

/**
 * XP for finishing a lesson. The first time is worth the most; repeating a lesson still
 * earns a little, so practice is rewarded without making XP easy to farm.
 */
export function xpForLesson(correct: number, total: number, firstTime: boolean): number {
  const ratio = total > 0 ? correct / total : 0;
  return firstTime ? Math.round(30 + ratio * 20) : Math.round(2 + ratio * 8);
}

/** XP for the daily practice: only the first practice of each day earns any. */
export function xpForPractice(correct: number, total: number, firstToday: boolean): number {
  if (!firstToday) return 0;
  return Math.round(10 + (total > 0 ? correct / total : 0) * 15);
}

/** Total XP needed to reach a level. Level 1 starts at 0, then 100, 250, 450, 700 and so on. */
export const xpToReach = (level: number): number => 25 * level * (level + 1) - 50;

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level is worth in total. */
  span: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpToReach(level + 1)) level += 1;
  return {
    level,
    into: xp - xpToReach(level),
    span: xpToReach(level + 1) - xpToReach(level),
  };
}

/** Rank titles stop at the last one, however high the level goes. */
export const RANKS = ["beginner", "explorer", "speaker", "storyteller", "orator", "champion"] as const;
export type Rank = (typeof RANKS)[number];

export const rankFor = (level: number): Rank => RANKS[Math.min(level, RANKS.length) - 1];
