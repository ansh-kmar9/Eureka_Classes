"use server";

import { cookies } from "next/headers";
import { saveProfilePreference } from "@/features/profile/preferences";
import { isLocale, LOCALE_COOKIE } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Stores the language in a cookie, and on the profile when signed in.
 * Pass `persist: false` when applying a language that is already saved on the profile.
 */
export async function setLocale(locale: string, persist = true) {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  if (persist) await saveProfilePreference({ language: locale });
}
