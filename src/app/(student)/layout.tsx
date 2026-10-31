import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { getStudentNavItems } from "@/components/layout/student-nav-items";
import { AnnouncementsBell } from "@/features/announcements/components/announcements-bell";
import {
  buildAnnouncementFeed,
  listLatestAnnouncements,
} from "@/features/announcements/queries";
import { requireStudent } from "@/features/auth/guards";
import { OfflineSync } from "@/features/offline/components/offline-sync";

// Signed-in screens are private: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Everything the frame needs loads at the same time. Announcements do not depend on the profile,
  // and only approved students can read them, so only they get the bell.
  const [profile, items, t, announcements] = await Promise.all([
    requireStudent(),
    getStudentNavItems(),
    getTranslations("studentNav"),
    listLatestAnnouncements(),
  ]);
  const feed =
    profile.status === "approved" ? buildAnnouncementFeed(announcements, profile) : null;

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
