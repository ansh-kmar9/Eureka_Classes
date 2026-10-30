import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Bell,
  Bot,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Mic,
  ShieldCheck,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { FeatureCard } from "@/features/marketing/components/feature-card";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { Section } from "@/features/marketing/components/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("featuresTitle"),
    description: t("featuresDescription"),
    alternates: { canonical: "/features" },
  };
}

const studentFeatures = [
  { key: "tests", icon: ClipboardCheck },
  { key: "scheduled", icon: Bell },
  { key: "courses", icon: BookOpen },
  { key: "dashboard", icon: LayoutDashboard },
  { key: "community", icon: MessageSquare },
  { key: "bot", icon: Bot },
  { key: "spoken", icon: Mic },
  { key: "offline", icon: WifiOff },
] as const;

const teacherFeatures = [
  { key: "approve", icon: UserCheck },
  { key: "manage", icon: Users },
  { key: "announce", icon: Megaphone },
  { key: "create", icon: ClipboardCheck },
  { key: "moderate", icon: ShieldCheck },
] as const;

export default async function FeaturesPage() {
  const t = await getTranslations("features");

  return (
    <>
      <PageIntro title={t("title")} subtitle={t("subtitle")} />

      <Section title={t("studentsTitle")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {studentFeatures.map(({ key, icon }) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`students.${key}.title`)}
              description={t(`students.${key}.description`)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("teachersTitle")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teacherFeatures.map(({ key, icon }) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`teachers.${key}.title`)}
              description={t(`teachers.${key}.description`)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
