import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { getTeacherNavItems } from "@/components/layout/staff-nav-items";
import { requireStaff } from "@/features/auth/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();
  const items = await getTeacherNavItems();
  const t = await getTranslations("teacherNav");

  return (
    <AppShell
      profile={profile}
      items={items}
      navLabel={t("label")}
      homeHref="/teacher"
      profileHref="/teacher/account"
    >
      {children}
    </AppShell>
  );
}
