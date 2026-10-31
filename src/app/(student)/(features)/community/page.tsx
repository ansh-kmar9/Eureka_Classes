import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MessagesSquare } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
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
      <PageHero icon={MessagesSquare} title={t("title")} subtitle={t("subtitle")} />
      <CommunityFeed initial={initial} currentUserId={profile.id} canModerate={false} />
    </div>
  );
}
