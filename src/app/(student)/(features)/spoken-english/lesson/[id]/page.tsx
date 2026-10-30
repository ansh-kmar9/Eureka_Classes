import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { LessonPlayer } from "@/features/spoken/components/lesson-player";
import { getSpokenState, unlockedIds } from "@/features/spoken/queries";
import { getLessonRef } from "@/lib/spoken/course";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Lesson" };

export default async function SpokenLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { id } = await params;
  const ref = getLessonRef(id);
  if (!ref) notFound();

  // Lessons open in order: typing a later lesson's address just goes back to the course.
  const state = await getSpokenState(profile.id);
  if (!unlockedIds(state.stars).has(id)) redirect("/spoken-english");

  const t = await getTranslations("spoken");
  const locale = (await getLocale()) === "hi" ? "hi" : "en";
  const pool = ref.level.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.phrases));

  return (
    <div className="space-y-3">
      <BackLink href="/spoken-english">{t("backToCourse")}</BackLink>
      <LessonPlayer
        lessonId={id}
        title={ref.lesson.title}
        tip={ref.lesson.tip}
        phrases={ref.lesson.phrases}
        pool={pool}
        locale={locale}
      />
    </div>
  );
}
