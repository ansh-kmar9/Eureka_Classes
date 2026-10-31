import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassFilter, parseClassParam } from "@/features/content/components/class-filter";
import { CourseCard } from "@/features/courses/components/course-card";
import { getCourseSummaries } from "@/features/courses/queries";

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

  const summaries = await getCourseSummaries({ classFilter });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/teacher/content/courses/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="size-4" aria-hidden />
          {t("new")}
        </Link>
      </div>

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
