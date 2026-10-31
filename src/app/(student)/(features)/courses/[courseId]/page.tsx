import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Circle, FileText, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BackLink } from "@/components/ui/back-link";
import { requireApprovedStudent } from "@/features/auth/guards";
import { getCourseDetail } from "@/features/courses/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId, profile.id);
  if (!detail) notFound();

  const t = await getTranslations("courses");
  const { course, subject, lessons, completed } = detail;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/courses">{t("back")}</BackLink>

      <Card className="space-y-3">
        <Badge tone="primary" className="w-fit">
          {subject}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
        {course.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        )}
        <div className="space-y-1.5">
          <ProgressBar value={completed.size} max={lessons.length} label={course.title} />
          <p className="text-xs text-muted-foreground">
            {lessons.length === 0
              ? t("noLessons")
              : t("progress", { done: completed.size, total: lessons.length })}
          </p>
        </div>
      </Card>

      <h2 className="text-lg font-semibold">{t("lessonsTitle")}</h2>
      {lessons.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("noLessons")}</p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {lessons.map((lesson, index) => {
            const done = completed.has(lesson.id);
            const Icon = lesson.type === "video" ? PlayCircle : FileText;
            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${course.id}/${lesson.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="w-5 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {lesson.type === "video" ? t("video") : t("pdf")}
                    </span>
                  </span>
                  {done ? (
                    <CheckCircle2
                      className={cn("size-5 shrink-0 text-success")}
                      aria-label={t("completed")}
                    />
                  ) : (
                    <Circle className="size-5 shrink-0 text-border" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
