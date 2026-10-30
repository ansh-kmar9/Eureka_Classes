import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { CourseMap } from "@/features/spoken/components/course-map";
import { SpokenHeader } from "@/features/spoken/components/spoken-header";
import { getSpokenState, unlockedIds } from "@/features/spoken/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("spoken");
  return { title: t("title") };
}

export default async function SpokenEnglishPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("spoken");
  const locale = (await getLocale()) === "hi" ? "hi" : "en";
  const state = await getSpokenState(profile.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SpokenHeader state={state} />
      <CourseMap stars={state.stars} unlocked={unlockedIds(state.stars)} locale={locale} />
    </div>
  );
}
