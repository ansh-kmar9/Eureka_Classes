"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next: Locale = locale === "en" ? "hi" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 px-3"
      disabled={pending}
      aria-label={t("switchLanguage")}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
    >
      <Languages className="size-4" aria-hidden />
      {next === "hi" ? "हिन्दी" : "English"}
    </Button>
  );
}
