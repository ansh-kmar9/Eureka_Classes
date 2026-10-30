import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassFilter, parseClassParam } from "@/features/content/components/class-filter";
import { CourseCard } from "@/features/courses/components/course-card";
import { CourseForm } from "@/features/courses/components/course-form";
import { getCourseSummaries, listSubjects } from "@/features/courses/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.courses");
  return { title: t("title") };
}

export default async function TeacherCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const t = await getTranslations("content.courses");
  const classFilter = parseClassParam((await searchParams).class);

  const [summaries, subjects] = await Promise.all([
    getCourseSummaries({ classFilter }),
    listSubjects(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <CourseForm subjects={subjects} />

      <ClassFilter basePath="/teacher/content/courses" selected={classFilter} />

      {summaries.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("empty")} description={t("emptyBody")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {summaries.map((summary) => (
            <li key={summary.course.id}>
              <CourseCard
                summary={summary}
                href={`/teacher/content/courses/${summary.course.id}`}
                showProgress={false}
                showAudience
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
