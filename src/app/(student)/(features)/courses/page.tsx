import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedStudent } from "@/features/auth/guards";
import { CourseCard } from "@/features/courses/components/course-card";
import { getCourseSummaries } from "@/features/courses/queries";
import { groupBySubject } from "@/features/materials/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("courses");
  return { title: t("title") };
}

export default async function CoursesPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("courses");
  const common = await getTranslations("common");
  const summaries = await getCourseSummaries({ studentId: profile.id });
  const groups = groupBySubject(summaries);

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">{common("backToDashboard")}</BackLink>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        groups.map(([subject, items]) => (
          <section key={subject} className="space-y-3">
            <h2 className="text-lg font-semibold">{subject}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((summary) => (
                <li key={summary.course.id}>
                  <CourseCard summary={summary} href={`/courses/${summary.course.id}`} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
