import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/features/auth/guards";
import { homePathFor } from "@/features/auth/utils";
import { OnboardingForm } from "@/features/profile/components/onboarding-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const profile = await requireProfile();
  // Staff and students who already finished onboarding have nothing to do here.
  if (profile.role !== "student" || profile.status !== "incomplete") {
    redirect(homePathFor(profile));
  }

  const t = await getTranslations("onboarding");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Logo href="/onboarding" />
        <div className="flex items-center">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <Card className="p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
        <OnboardingForm defaultName={profile.full_name ?? ""} />
      </Card>
    </div>
  );
}
