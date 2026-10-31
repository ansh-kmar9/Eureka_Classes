import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUp, ExternalLink, FileText, PlayCircle, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { AudienceLabel } from "@/features/content/components/audience-label";
import { deleteCourse, deleteLesson, moveLesson } from "@/features/courses/actions";
import { LessonForm } from "@/features/courses/components/lesson-form";
import { getCourseDetail } from "@/features/courses/queries";

export const metadata: Metadata = { title: "Course" };

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCourseDetail(id);
  if (!detail) notFound();

  const t = await getTranslations("content");
  const toasts = await getTranslations("toasts");
  const { course, subject, lessons } = detail;

  // Server Actions can't redirect the page that called them cleanly after a delete,
  // so deleting a course goes through a tiny wrapper that returns to the list.
  async function removeCourse() {
    "use server";
    const result = await deleteCourse(id);
    if (result.ok) redirect("/teacher/content/courses");
    return result;
  }

  return (
    <div className="space-y-4">
      <BackLink href="/teacher/content/courses">{t("courses.back")}</BackLink>

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="primary">{subject}</Badge>
          <Badge>
            <AudienceLabel classNumber={course.class} stream={course.stream} />
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
        {course.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        )}
        <ActionButton
          variant="outline"
          size="sm"
          action={removeCourse}
          confirm={{
            title: t("courses.deleteTitle"),
            description: t("courses.deleteBody"),
            confirmLabel: t("courses.delete"),
            cancelLabel: t("cancel"),
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          {t("courses.delete")}
        </ActionButton>
      </Card>

      <h2 className="text-lg font-semibold">{t("lessons.title")}</h2>
      {lessons.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("lessons.empty")}</p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {lessons.map((lesson, index) => {
            const Icon = lesson.type === "video" ? PlayCircle : FileText;
            return (
              <li key={lesson.id}>
                <Card className="flex items-center gap-2 p-3">
                  <span className="w-5 text-center text-sm text-muted-foreground">{index + 1}</span>
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 break-words font-medium">{lesson.title}</span>
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("lessons.open")}
                    className="flex size-11 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("lessons.moveUp")}
                    disabled={index === 0}
                    action={moveLesson.bind(null, lesson.id, "up")}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </ActionButton>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("lessons.moveDown")}
                    disabled={index === lessons.length - 1}
                    action={moveLesson.bind(null, lesson.id, "down")}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </ActionButton>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("lessons.delete")}
                    action={deleteLesson.bind(null, lesson.id)}
                    successMessage={toasts("deleted")}
                    confirm={{
                      title: t("lessons.deleteTitle"),
                      description: t("lessons.deleteBody"),
                      confirmLabel: t("lessons.delete"),
                      cancelLabel: t("cancel"),
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </ActionButton>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      <LessonForm courseId={course.id} />
    </div>
  );
}
