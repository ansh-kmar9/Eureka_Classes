import { getTranslations } from "next-intl/server";
import type { NavItem } from "./icons";

export async function getTeacherNavItems(): Promise<NavItem[]> {
  const t = await getTranslations("teacherNav");
  return [
    { href: "/teacher", label: t("students"), icon: "students" },
    { href: "/teacher/content", label: t("content"), icon: "courses" },
    { href: "/teacher/tests", label: t("tests"), icon: "test" },
    { href: "/teacher/community", label: t("community"), icon: "community" },
    { href: "/teacher/announcements", label: t("announcements"), icon: "announcements" },
  ];
}

export async function getAdminNavItems(): Promise<NavItem[]> {
  const t = await getTranslations("adminNav");
  return [
    { href: "/admin", label: t("teachers"), icon: "teachers" },
    { href: "/admin/messages", label: t("messages"), icon: "messages" },
    { href: "/teacher", label: t("panel"), icon: "panel" },
  ];
}
