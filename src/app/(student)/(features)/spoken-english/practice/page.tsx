import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { PracticeSession } from "@/features/spoken/components/practice-session";
import { getSpokenState } from "@/features/spoken/queries";
import { LESSONS } from "@/lib/spoken/course";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Daily practice" };

export default async function SpokenPracticePage() {
  const profile = await requireApprovedStudent();
  const state = await getSpokenState(profile.id);

  // Practice reviews what has been learned, so it opens after the first lesson.
  const learned = LESSONS.filter(({ lesson }) => state.stars.has(lesson.id)).flatMap(
    ({ lesson }) => lesson.phrases,
  );
  if (learned.length === 0) redirect("/spoken-english");

  const t = await getTranslations("spoken");

  return (
    <div className="space-y-3">
      <BackLink href="/spoken-english">{t("backToCourse")}</BackLink>
      <PracticeSession learned={learned} alreadyPracticed={state.practicedToday} />
    </div>
  );
}
