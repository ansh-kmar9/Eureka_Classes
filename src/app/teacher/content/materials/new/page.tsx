import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { listSubjects } from "@/features/courses/queries";
import { MaterialForm } from "@/features/materials/components/material-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.materials");
  return { title: t("new") };
}

export default async function NewMaterialPage() {
  const t = await getTranslations("content.chooser");
  const subjects = await listSubjects();

  return (
    <div className="space-y-4">
      <BackLink href="/teacher/content">{t("back")}</BackLink>
      <MaterialForm subjects={subjects} />
    </div>
  );
}
