import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireStudent } from "@/features/auth/guards";
import { ClassCard } from "@/features/profile/components/class-card";
import { DetailsForm } from "@/features/profile/components/details-form";
import { StatusBadge } from "@/features/students/components/status-badge";
import { StudentAvatar } from "@/features/students/components/student-card";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const profile = await requireStudent();
  const t = await getTranslations("profile");
  const enrolment = await getTranslations("enrolment");
  const common = await getTranslations("common");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("class_change_requests")
    .select("*")
    .eq("student_id", profile.id)
    .eq("status", "pending")
    .limit(1);

  const canChangeClass = profile.status === "pending" || profile.status === "approved";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <BackLink href="/dashboard">{common("backToDashboard")}</BackLink>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <Card className="flex items-center gap-4">
        <StudentAvatar student={profile} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{profile.full_name}</p>
          <p className="break-words text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <StatusBadge status={profile.status} />
      </Card>

      <DetailsForm
        defaults={{
          fullName: profile.full_name ?? "",
          age: String(profile.age ?? ""),
          mobile: profile.mobile ?? "",
        }}
      />

      {canChangeClass && profile.class && (
        <ClassCard
          mode={profile.status === "approved" ? "request" : "direct"}
          currentBoard={profile.board}
          currentClass={profile.class}
          currentStream={profile.stream}
          pendingRequest={requests?.[0] ?? null}
        />
      )}

      <SignOutButton label={enrolment("signOut")} />
    </div>
  );
}
