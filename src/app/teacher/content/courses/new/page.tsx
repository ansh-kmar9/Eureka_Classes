import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { CourseForm } from "@/features/courses/components/course-form";
import { listSubjects } from "@/features/courses/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.courses");
  return { title: t("new") };
}

export default async function NewCoursePage() {
  const t = await getTranslations("content.chooser");
  const subjects = await listSubjects();

  return (
    <div className="space-y-4">
      <BackLink href="/teacher/content">{t("back")}</BackLink>
      <CourseForm subjects={subjects} />
    </div>
  );
}
