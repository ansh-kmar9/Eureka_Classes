import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { getStudentNavItems } from "@/components/layout/student-nav-items";
import { AnnouncementsBell } from "@/features/announcements/components/announcements-bell";
import { getAnnouncementFeed } from "@/features/announcements/queries";
import { requireStudent } from "@/features/auth/guards";
import { OfflineSync } from "@/features/offline/components/offline-sync";

// Signed-in screens are private: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  // Independent lookups run together instead of one after the other.
  // Only approved students can read announcements, so only they get the bell.
  const [items, t, feed] = await Promise.all([
    getStudentNavItems(),
    getTranslations("studentNav"),
    profile.status === "approved" ? getAnnouncementFeed(profile) : null,
  ]);

  return (
    <AppShell
      profile={profile}
      items={items}
      navLabel={t("label")}
      homeHref="/dashboard"
      headerActions={
        feed && <AnnouncementsBell items={feed.items} seenAt={feed.seenAt} />
      }
    >
      <OfflineSync userId={profile.id} />
      {children}
    </AppShell>
  );
}
