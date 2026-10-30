import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { CommunityFeed } from "@/features/community/components/community-feed";
import { loadFeed } from "@/features/community/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("community") };
}

export default async function CommunityPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("community");
  const initial = await loadFeed();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CommunityFeed initial={initial} currentUserId={profile.id} canModerate={false} />
    </div>
  );
}
