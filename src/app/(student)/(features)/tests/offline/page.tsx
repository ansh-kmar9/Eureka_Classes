import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { OfflineTestsList } from "@/features/offline/components/offline-tests-list";
import { BackLink } from "@/components/ui/back-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offlineTests");
  return { title: t("title") };
}

export default async function OfflineTestsPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("offlineTests");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/tests">{t("backToTests")}</BackLink>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <OfflineTestsList userId={profile.id} />
    </div>
  );
}
