export type PushLocale = "en" | "hi";

export interface PushPayload {
  title: string;
  body: string;
  /** Path opened when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other. */
  tag?: string;
}

const welcome: Record<PushLocale, Pick<PushPayload, "title" | "body">> = {
  en: {
    title: "Welcome to Eureka Classes!",
    body: "Your enrolment is approved. All features are now unlocked.",
  },
  hi: {
    title: "यूरेका क्लासेस में आपका स्वागत है!",
    body: "आपका नामांकन अप्रूव हो गया है। सभी फ़ीचर्स अब खुल गए हैं।",
  },
};

/** "5 Nov, 1:00 pm" in India time, in the reader's language. */
const formatWhen = (locale: PushLocale, iso: string) =>
  new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/** Builders return the payload in the recipient's language. */
export const pushMessages = {
  welcome: (locale: PushLocale): PushPayload => ({
    ...welcome[locale],
    url: "/dashboard",
    tag: "welcome",
  }),

  // Announcements are written by teachers, so they are sent as written.
  announcement: (title: string, body: string): PushPayload => ({
    title,
    body: truncate(body, 140),
    url: "/dashboard",
    tag: "announcement",
  }),

  testScheduled: (
    locale: PushLocale,
    test: { title: string; startsAt: string; minutes: number },
  ): PushPayload => ({
    title: locale === "hi" ? "नया टेस्ट शेड्यूल हुआ" : "New test scheduled",
    body:
      locale === "hi"
        ? `${test.title}: ${formatWhen(locale, test.startsAt)}, ${test.minutes} मिनट`
        : `${test.title}: ${formatWhen(locale, test.startsAt)}, ${test.minutes} min`,
    url: "/tests/scheduled",
    tag: "test-scheduled",
  }),

  testCancelled: (locale: PushLocale, test: { title: string }): PushPayload => ({
    title: locale === "hi" ? "टेस्ट रद्द हुआ" : "Test cancelled",
    body: test.title,
    url: "/tests/scheduled",
    tag: "test-cancelled",
  }),
};
