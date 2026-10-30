import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireApprovedStudent } from "@/features/auth/guards";
import { PdfViewer } from "@/features/documents/components/pdf-viewer";
import { LessonCompleteButton } from "@/features/courses/components/lesson-complete-button";
import { YouTubePlayer } from "@/features/courses/components/youtube-player";
import { getCourseDetail } from "@/features/courses/queries";
import { parseYouTubeId } from "@/lib/youtube";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { courseId, lessonId } = await params;
  const detail = await getCourseDetail(courseId, profile.id);
  if (!detail) notFound();

  const index = detail.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) notFound();

  const t = await getTranslations("courses");
  const lesson = detail.lessons[index];
  const previous = detail.lessons[index - 1];
  const next = detail.lessons[index + 1];
  const videoId = lesson.type === "video" ? parseYouTubeId(lesson.url) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {detail.course.title}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>

      {videoId ? (
        <YouTubePlayer videoId={videoId} title={lesson.title} />
      ) : (
        <PdfViewer url={lesson.url} title={lesson.title} />
      )}

      <LessonCompleteButton lessonId={lesson.id} completed={detail.completed.has(lesson.id)} />

      <nav className="flex items-center justify-between gap-3 pt-2" aria-label={t("lessonsTitle")}>
        {previous ? (
          <Link
            href={`/courses/${courseId}/${previous.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("previous")}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/courses/${courseId}/${next.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("next")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}
