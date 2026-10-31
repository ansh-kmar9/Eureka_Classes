import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getTeacherNavItems } from "@/components/layout/staff-nav-items";
import { requireStaff } from "@/features/auth/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();
  const [items, t] = await Promise.all([getTeacherNavItems(), getTranslations("teacherNav")]);
  const isAdmin = profile.role === "admin";

  return (
    <AppShell
      profile={profile}
      items={items}
      navLabel={t("label")}
      homeHref="/teacher"
      profileHref="/teacher/account"
      headerActions={
        isAdmin && (
          <Link
            href="/admin"
            aria-label={t("adminPanel")}
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-11 px-3" })}
          >
            <ShieldCheck className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t("adminPanel")}</span>
          </Link>
        )
      }
    >
      {children}
    </AppShell>
  );
}
