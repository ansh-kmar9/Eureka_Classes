import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/features/auth/guards";
import { loadFeed } from "@/features/community/actions";
import { CommunityFeed } from "@/features/community/components/community-feed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("community") };
}

export default async function TeacherCommunityPage() {
  const profile = await requireStaff();
  const t = await getTranslations("community");
  const initial = await loadFeed();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("moderatorHint")}</p>
      </div>
      {/* Teachers can post, and can delete any message. */}
      <CommunityFeed initial={initial} currentUserId={profile.id} canModerate />
    </div>
  );
}
