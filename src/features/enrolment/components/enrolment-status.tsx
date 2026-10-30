import { getTranslations } from "next-intl/server";
import { Clock, PauseCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { Profile } from "@/lib/supabase/types";

/** Shown on the dashboard while a student is waiting for approval, or has been blocked. */
export async function EnrolmentStatus({ profile }: { profile: Profile }) {
  const t = await getTranslations("enrolment");
  const blocked = profile.status === "blocked";
  const Icon = blocked ? PauseCircle : Clock;

  const details = [
    { label: t("name"), value: profile.full_name },
    {
      label: t("class"),
      value: profile.class
        ? profile.stream
          ? `${profile.class} · ${profile.stream}`
          : String(profile.class)
        : null,
    },
    { label: t("mobile"), value: profile.mobile },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="flex flex-col items-center py-10 text-center">
        <span
          className={
            blocked
              ? "mb-4 flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger"
              : "mb-4 flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-foreground"
          }
        >
          <Icon className="size-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">
          {blocked ? t("blockedTitle") : t("pendingTitle")}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {blocked ? t("blockedBody") : t("pendingBody")}
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">{t("detailsTitle")}</h2>
        <dl className="divide-y divide-border text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex justify-center">
        <SignOutButton label={t("signOut")} />
      </div>
    </div>
  );
}
