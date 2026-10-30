import { getTranslations } from "next-intl/server";
import type { NavItem } from "./icons";

export async function getStudentNavItems(): Promise<NavItem[]> {
  const t = await getTranslations("studentNav");
  return [
    { href: "/tests", label: t("test"), icon: "test" },
    { href: "/dashboard", label: t("dashboard"), icon: "dashboard" },
    { href: "/community", label: t("community"), icon: "community" },
    { href: "/eurekabot", label: t("bot"), icon: "bot" },
    { href: "/spoken-english", label: t("spoken"), icon: "spokenEnglish" },
  ];
}
