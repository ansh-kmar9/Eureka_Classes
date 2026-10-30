import { getTranslations } from "next-intl/server";
import type { NavItem } from "./icons";

export async function getPublicNavItems(signedIn = false): Promise<NavItem[]> {
  const t = await getTranslations("nav");
  return [
    { href: "/", label: t("home"), icon: "home" },
    { href: "/about", label: t("about"), icon: "about" },
    { href: "/features", label: t("features"), icon: "features" },
    { href: "/contact", label: t("contact"), icon: "contact" },
    signedIn
      ? { href: "/dashboard", label: t("app"), icon: "dashboard" }
      : { href: "/login", label: t("login"), icon: "login" },
  ];
}
