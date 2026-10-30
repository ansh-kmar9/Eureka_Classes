"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { setLocale } from "@/i18n/actions";
import type { Profile } from "@/lib/supabase/types";

/**
 * Applies the language and theme saved on the profile, so a student's choice
 * follows them to a new phone. Renders nothing.
 */
export function PreferenceSync({
  language,
  theme: savedTheme,
}: {
  language: Profile["language"];
  theme: Profile["theme"];
}) {
  const router = useRouter();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (language && language !== locale) {
      void setLocale(language, false).then(() => router.refresh());
    }
    // Only on first mount: after that the user's own toggles win.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (savedTheme && savedTheme !== theme) setTheme(savedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
