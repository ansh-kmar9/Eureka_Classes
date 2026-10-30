import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BoardType,
  CatalogSubject,
  CatalogTopic,
  LeaderboardRow,
  PracticeAttempt,
  PracticeTest,
  Question,
  StreamType,
  StudentBadge,
} from "@/lib/supabase/types";

/** Which part of the catalog to show: one board, one class, and (for 11 and 12) optionally one stream. */
export interface CatalogScope {
  board: BoardType;
  class: number;
  stream: StreamType | null;
}

export interface TopicEntry {
  topic: CatalogTopic;
  /** The practice test for this topic, if one exists (students only ever see published ones). */
  test: PracticeTest | null;
  questionCount: number;
  /** The caller's best score on this topic's test, if they have attempted it. */
  bestScore: number | null;
  attempts: number;
}

export interface SubjectEntry {
  subject: CatalogSubject;
  topics: TopicEntry[];
}

async function buildEntries(
  subjects: CatalogSubject[],
  studentId?: string,
): Promise<SubjectEntry[]> {
  if (!subjects.length) return [];
  const supabase = await createClient();

  const { data: topics } = await supabase
    .from("catalog_topics")
    .select("*")
    .in("subject_id", subjects.map((s) => s.id))
    .order("position")
    .order("name");

  const topicIds = topics?.map((t) => t.id) ?? [];
  const { data: tests } = topicIds.length
    ? await supabase.from("practice_tests").select("*").in("topic_id", topicIds)
    : { data: [] as PracticeTest[] };

  const testIds = tests?.map((t) => t.id) ?? [];
  const counts = new Map<string, number>();
  const best = new Map<string, number>();
  const taken = new Map<string, number>();

  if (testIds.length) {
    const { data: questions } = await supabase
      .from("questions")
      .select("test_id")
      .in("test_id", testIds);
    questions?.forEach((q) => counts.set(q.test_id, (counts.get(q.test_id) ?? 0) + 1));

    if (studentId) {
      const { data: attempts } = await supabase
        .from("practice_attempts")
        .select("test_id, score")
        .eq("student_id", studentId)
        .in("test_id", testIds);
      attempts?.forEach((a) => {
        best.set(a.test_id, Math.max(best.get(a.test_id) ?? 0, a.score));
        taken.set(a.test_id, (taken.get(a.test_id) ?? 0) + 1);
      });
    }
  }

  const testByTopic = new Map(tests?.map((t) => [t.topic_id, t]));

  return subjects.map((subject) => ({
    subject,
    topics: (topics ?? [])
      .filter((topic) => topic.subject_id === subject.id)
      .map((topic) => {
        const test = testByTopic.get(topic.id) ?? null;
        return {
          topic,
          test,
          questionCount: test ? (counts.get(test.id) ?? 0) : 0,
          bestScore: test ? (best.get(test.id) ?? null) : null,
          attempts: test ? (taken.get(test.id) ?? 0) : 0,
        };
      }),
  }));
}

/**
 * Subjects of a board, class and stream with their topics and tests.
 * Row-level security hides inactive items and unpublished tests from students.
 */
export async function getCatalog(
  scope: CatalogScope,
  options: { studentId?: string } = {},
): Promise<SubjectEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("catalog_subjects")
    .select("*")
    .eq("board", scope.board)
    .eq("class", scope.class)
    .order("position")
    .order("name");
  // Stream-neutral subjects (English, Hindi) are shared by every stream.
  if (scope.stream) query = query.or(`stream.is.null,stream.eq.${scope.stream}`);

  const { data: subjects } = await query;
  return buildEntries(subjects ?? [], options.studentId);
}

export async function getSubjectEntry(
  subjectId: string,
  studentId?: string,
): Promise<SubjectEntry | null> {
  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("catalog_subjects")
    .select("*")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) return null;

  const [entry] = await buildEntries([subject], studentId);
  return entry ?? null;
}

/** A test with the topic and subject it belongs to. */
export async function getTestDetail(testId: string) {
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("practice_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return null;

  const { data: topic } = await supabase
    .from("catalog_topics")
    .select("*")
    .eq("id", test.topic_id)
    .maybeSingle();
  if (!topic) return null;

  const { data: subject } = await supabase
    .from("catalog_subjects")
    .select("*")
    .eq("id", topic.subject_id)
    .maybeSingle();
  if (!subject) return null;

  return { test, topic, subject };
}

/** Questions in the one order used everywhere, so answer positions always line up. */
export async function getQuestions(testId: string): Promise<Question[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", testId)
    .order("position")
    .order("created_at");
  return data ?? [];
}

export async function getAttempts(testId: string, studentId: string): Promise<PracticeAttempt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function getAttempt(attemptId: string, studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();
  return data;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("class_leaderboard", { limit_rows: limit });
  return data ?? [];
}

export async function getBadges(studentId: string): Promise<StudentBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_badges")
    .select("*")
    .eq("student_id", studentId)
    .order("earned_at", { ascending: false });
  return data ?? [];
}
