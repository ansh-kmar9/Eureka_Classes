/** Badge keys are stored in the database; their names come from the `badges` messages. */
export const BADGES = [
  "first_test",
  "five_tests",
  "ten_tests",
  "high_scorer",
  "perfect_score",
  "streak_7",
  "course_complete",
  "spoken_first",
  "spoken_ten",
  "spoken_streak_3",
] as const;

export type BadgeKey = (typeof BADGES)[number];

export interface AttemptStats {
  /** How many attempts the student has made in total. */
  attempts: number;
  /** Their best percentage on any single attempt, 0 to 100. */
  bestPercent: number;
  /** Distinct calendar days (Asia/Kolkata, "YYYY-MM-DD") on which they took a test. */
  days: string[];
}

/** Consecutive days ending today or yesterday (so a streak survives until midnight tomorrow). */
export function currentStreak(days: string[], today: string): number {
  const set = new Set(days);
  const dayMs = 24 * 60 * 60 * 1000;
  const shift = (iso: string, by: number) =>
    new Date(Date.parse(`${iso}T00:00:00Z`) + by * dayMs).toISOString().slice(0, 10);

  let cursor = set.has(today) ? today : shift(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

/** Badges earned from test attempts alone (course completion is awarded separately). */
export function badgesFromAttempts(stats: AttemptStats, today: string): BadgeKey[] {
  const earned: BadgeKey[] = [];
  if (stats.attempts >= 1) earned.push("first_test");
  if (stats.attempts >= 5) earned.push("five_tests");
  if (stats.attempts >= 10) earned.push("ten_tests");
  if (stats.bestPercent >= 90) earned.push("high_scorer");
  if (stats.bestPercent >= 100) earned.push("perfect_score");
  if (currentStreak(stats.days, today) >= 7) earned.push("streak_7");
  return earned;
}

/** "YYYY-MM-DD" in India time, the timezone students live in. */
export function istDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}
