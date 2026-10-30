// Hand-written to match supabase/migrations. Replace with `supabase gen types` output if the schema grows large.

export type UserRole = "student" | "teacher" | "admin";
export type StudentStatus = "incomplete" | "pending" | "approved" | "blocked";
export type StreamType = "science" | "commerce" | "arts";
export type RequestStatus = "pending" | "approved" | "rejected";
export type ThemePreference = "light" | "dark" | "system";
export type BoardType = "cbse" | "bseb";
export type ScheduledStatus = "draft" | "scheduled" | "cancelled";

export type Profile = {
  id: string;
  email: string;
  avatar_url: string | null;
  full_name: string | null;
  board: BoardType | null;
  class: number | null;
  stream: StreamType | null;
  age: number | null;
  mobile: string | null;
  role: UserRole;
  status: StudentStatus;
  language: "en" | "hi" | null;
  theme: ThemePreference | null;
  approved_at: string | null;
  approved_by: string | null;
  announcements_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClassChangeRequest = {
  id: string;
  student_id: string;
  from_class: number | null;
  to_board: BoardType | null;
  to_class: number;
  to_stream: StreamType | null;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
}

export type Announcement = {
  id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
}

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type Subject = {
  id: string;
  name: string;
  created_at: string;
}

export type Course = {
  id: string;
  class: number;
  stream: StreamType | null;
  subject_id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export type LessonType = "video" | "pdf";

export type Lesson = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  type: LessonType;
  url: string;
  created_at: string;
}

export type LessonProgress = {
  student_id: string;
  lesson_id: string;
  completed_at: string;
}

export type StudyMaterial = {
  id: string;
  class: number;
  stream: StreamType | null;
  subject_id: string;
  title: string;
  url: string;
  created_by: string;
  created_at: string;
}

export type CatalogSubject = {
  id: string;
  board: BoardType;
  class: number;
  stream: StreamType | null;
  name: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

export type CatalogTopic = {
  id: string;
  subject_id: string;
  name: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

export type PracticeTest = {
  id: string;
  topic_id: string;
  duration_minutes: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export type Question = {
  id: string;
  test_id: string;
  position: number;
  text: string;
  options: string[];
  correct: number;
  explanation: string | null;
  created_at: string;
}

export type PracticeAttempt = {
  id: string;
  student_id: string;
  test_id: string;
  answers: number[];
  score: number;
  total: number;
  duration_seconds: number;
  client_id: string;
  ai_analysis: string | null;
  ai_analyzed_at: string | null;
  submitted_at: string;
  created_at: string;
}

export type StudentBadge = {
  student_id: string;
  badge: string;
  earned_at: string;
}

export type LeaderboardRow = {
  rank: number;
  student_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  tests_taken: number;
  is_me: boolean;
}

export type ScheduledTest = {
  id: string;
  title: string;
  class: number;
  stream: StreamType | null;
  starts_at: string;
  duration_minutes: number;
  status: ScheduledStatus;
  created_by: string;
  created_at: string;
  cancelled_at: string | null;
}

export type ScheduledQuestion = {
  id: string;
  test_id: string;
  position: number;
  text: string;
  options: string[];
  created_at: string;
}

export type ScheduledAnswerKey = {
  question_id: string;
  correct: number;
}

export type ScheduledAttempt = {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  answers: number[];
  strikes: number;
  score: number | null;
  total: number | null;
  status: "in_progress" | "submitted";
  submit_reason: string | null;
  created_at: string;
}

export type CommunityMessage = {
  id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
}

export type CommunityLike = {
  message_id: string;
  user_id: string;
  created_at: string;
}

/** A message as returned by the community_feed / community_replies functions. */
export type CommunityRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_role: UserRole;
  author_class: number | null;
  like_count: number;
  liked_by_me: boolean;
  reply_count: number;
}

export type AiUsage = {
  id: number;
  user_id: string;
  kind: string;
  created_at: string;
}

export type SpokenProgress = {
  student_id: string;
  lesson_id: string;
  stars: number;
  best_percent: number;
  attempts: number;
  first_completed_at: string;
  last_completed_at: string;
}

export type SpokenActivity = {
  id: number;
  student_id: string;
  kind: "lesson" | "practice";
  ref: string | null;
  xp: number;
  day: string;
  created_at: string;
}

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        Pick<Profile, "id" | "email">,
        Partial<Omit<Profile, "id" | "email" | "created_at">>
      >;
      class_change_requests: Table<
        ClassChangeRequest,
        Pick<ClassChangeRequest, "student_id" | "to_class"> &
          Partial<Pick<ClassChangeRequest, "from_class" | "to_stream" | "to_board">>
      >;
      push_subscriptions: Table<
        PushSubscriptionRow,
        Omit<PushSubscriptionRow, "id" | "created_at">
      >;
      announcements: Table<
        Announcement,
        Pick<Announcement, "title" | "body">,
        Partial<Pick<Announcement, "title" | "body" | "created_by">>
      >;
      contact_messages: Table<
        ContactMessage,
        Pick<ContactMessage, "name" | "email" | "message"> &
          Partial<Pick<ContactMessage, "phone">>,
        Partial<Pick<ContactMessage, "is_read">>
      >;
      subjects: Table<Subject, Pick<Subject, "name">>;
      courses: Table<
        Course,
        Pick<Course, "class" | "subject_id" | "title"> &
          Partial<Pick<Course, "stream" | "description">>,
        Partial<Pick<Course, "class" | "subject_id" | "title" | "stream" | "description" | "created_by">>
      >;
      lessons: Table<
        Lesson,
        Pick<Lesson, "course_id" | "title" | "type" | "url"> &
          Partial<Pick<Lesson, "position">>
      >;
      lesson_progress: Table<
        LessonProgress,
        Pick<LessonProgress, "lesson_id"> & Partial<Pick<LessonProgress, "student_id">>
      >;
      study_materials: Table<
        StudyMaterial,
        Pick<StudyMaterial, "class" | "subject_id" | "title" | "url"> &
          Partial<Pick<StudyMaterial, "stream">>,
        Partial<Pick<StudyMaterial, "class" | "subject_id" | "title" | "url" | "stream" | "created_by">>
      >;
      catalog_subjects: Table<
        CatalogSubject,
        Pick<CatalogSubject, "board" | "class" | "name"> &
          Partial<Pick<CatalogSubject, "stream" | "position" | "is_active">>
      >;
      catalog_topics: Table<
        CatalogTopic,
        Pick<CatalogTopic, "subject_id" | "name"> &
          Partial<Pick<CatalogTopic, "position" | "is_active">>
      >;
      practice_tests: Table<
        PracticeTest,
        Pick<PracticeTest, "topic_id"> &
          Partial<Pick<PracticeTest, "duration_minutes" | "is_published">>,
        Partial<Pick<PracticeTest, "topic_id" | "duration_minutes" | "is_published" | "created_by">>
      >;
      questions: Table<
        Question,
        Pick<Question, "test_id" | "text" | "options" | "correct"> &
          Partial<Pick<Question, "position" | "explanation">>
      >;
      practice_attempts: Table<
        PracticeAttempt,
        Pick<
          PracticeAttempt,
          "student_id" | "test_id" | "answers" | "score" | "total" | "duration_seconds" | "client_id"
        > &
          Partial<Pick<PracticeAttempt, "ai_analysis" | "ai_analyzed_at" | "submitted_at">>
      >;
      student_badges: Table<StudentBadge, Pick<StudentBadge, "student_id" | "badge">>;
      scheduled_tests: Table<
        ScheduledTest,
        Pick<ScheduledTest, "title" | "class" | "starts_at" | "duration_minutes"> &
          Partial<Pick<ScheduledTest, "stream" | "status">>,
        Partial<
          Pick<
            ScheduledTest,
            "title" | "class" | "stream" | "starts_at" | "duration_minutes" | "status" | "created_by"
          >
        >
      >;
      scheduled_questions: Table<
        ScheduledQuestion,
        Pick<ScheduledQuestion, "test_id" | "text" | "options"> &
          Partial<Pick<ScheduledQuestion, "position">>
      >;
      scheduled_answer_keys: Table<ScheduledAnswerKey, ScheduledAnswerKey>;
      scheduled_attempts: Table<
        ScheduledAttempt,
        Pick<ScheduledAttempt, "test_id" | "student_id" | "deadline_at"> &
          Partial<Omit<ScheduledAttempt, "id" | "test_id" | "student_id" | "deadline_at" | "created_at">>,
        Partial<Omit<ScheduledAttempt, "id" | "test_id" | "student_id" | "created_at">>
      >;
      community_messages: Table<
        CommunityMessage,
        Pick<CommunityMessage, "body"> & Partial<Pick<CommunityMessage, "parent_id" | "author_id">>
      >;
      community_likes: Table<CommunityLike, Pick<CommunityLike, "message_id">>;
      ai_usage: Table<AiUsage, Pick<AiUsage, "user_id" | "kind">>;
      spoken_progress: Table<
        SpokenProgress,
        Pick<SpokenProgress, "student_id" | "lesson_id" | "stars" | "best_percent"> &
          Partial<Pick<SpokenProgress, "attempts" | "last_completed_at">>,
        Partial<Pick<SpokenProgress, "stars" | "best_percent" | "attempts" | "last_completed_at">>
      >;
      spoken_activity: Table<
        SpokenActivity,
        Pick<SpokenActivity, "student_id" | "kind" | "xp" | "day"> & Partial<Pick<SpokenActivity, "ref">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      community_feed: {
        Args: { p_limit?: number; p_before?: string | null };
        Returns: CommunityRow[];
      };
      community_replies: {
        Args: { p_parent: string };
        Returns: CommunityRow[];
      };
      class_leaderboard: {
        Args: { limit_rows?: number };
        Returns: LeaderboardRow[];
      };
      decide_class_change: {
        Args: { request_id: string; approve: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      student_status: StudentStatus;
      stream_type: StreamType;
      request_status: RequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
