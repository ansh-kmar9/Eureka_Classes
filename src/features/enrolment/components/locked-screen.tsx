import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Every feature screen shows this until a teacher approves the student. */
export async function LockedScreen() {
  const t = await getTranslations("enrolment");
  const nav = await getTranslations("studentNav");

  return (
    <EmptyState
      icon={Lock}
      title={t("lockedTitle")}
      description={t("lockedBody")}
      action={
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          {nav("dashboard")}
        </Link>
      }
    />
  );
}
