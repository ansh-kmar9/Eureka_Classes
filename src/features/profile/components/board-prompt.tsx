import Link from "next/link";
import { useTranslations } from "next-intl";
import { Landmark } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Shown to a student who has not chosen CBSE or BSEB yet; the test series depends on it. */
export function BoardPrompt() {
  const t = useTranslations("boards");

  return (
    <EmptyState
      icon={Landmark}
      title={t("promptTitle")}
      description={t("promptBody")}
      action={
        <Link href="/profile" className={buttonVariants()}>
          {t("promptAction")}
        </Link>
      }
    />
  );
}
