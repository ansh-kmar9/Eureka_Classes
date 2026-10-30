import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { getAdminNavItems } from "@/components/layout/staff-nav-items";
import { requireAdmin } from "@/features/auth/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const items = await getAdminNavItems();
  const t = await getTranslations("adminNav");

  return (
    <AppShell
      profile={profile}
      items={items}
      navLabel={t("label")}
      homeHref="/admin"
      profileHref="/admin/account"
    >
      {children}
    </AppShell>
  );
}
