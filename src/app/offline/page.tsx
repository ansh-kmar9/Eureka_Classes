import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Shown by the service worker when a page cannot be loaded without internet. */
export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo href="/dashboard" className="justify-center" />
      <EmptyState
        icon={WifiOff}
        title={t("title")}
        description={t("body")}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/tests/offline" className={buttonVariants()}>
              {t("downloaded")}
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              {t("retry")}
            </Link>
          </div>
        }
      />
    </div>
  );
}
