import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { StudentAvatar } from "@/features/students/components/student-card";
import type { Profile } from "@/lib/supabase/types";

/** Account page shared by teachers and the admin. */
export async function StaffAccount({ profile, homeHref }: { profile: Profile; homeHref: string }) {
  const t = await getTranslations("account");
  const enrolment = await getTranslations("enrolment");
  const common = await getTranslations("common");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <BackLink href={homeHref}>{common("backToHome")}</BackLink>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <Card className="flex items-center gap-4">
        <StudentAvatar student={profile} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{profile.full_name ?? profile.email}</p>
          <p className="break-words text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <Badge tone="primary">{t(`role.${profile.role === "admin" ? "admin" : "teacher"}`)}</Badge>
      </Card>
      <SignOutButton label={enrolment("signOut")} />
    </div>
  );
}
