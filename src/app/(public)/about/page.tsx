import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpenCheck, HeartHandshake, Lightbulb } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeatureCard } from "@/features/marketing/components/feature-card";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { Section } from "@/features/marketing/components/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: { canonical: "/about" },
  };
}

const values = [
  { key: "clarity", icon: Lightbulb },
  { key: "practice", icon: BookOpenCheck },
  { key: "care", icon: HeartHandshake },
] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <>
      <PageIntro title={t("title")} subtitle={t("intro")} />

      <Section title={t("missionTitle")}>
        <Card className="max-w-3xl bg-primary-soft">
          <p className="text-lg leading-relaxed">{t("mission")}</p>
        </Card>
      </Section>

      <Section title={t("valuesTitle")}>
        <div className="grid gap-3 md:grid-cols-3">
          {values.map(({ key, icon }) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`values.${key}.title`)}
              description={t(`values.${key}.description`)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("coverTitle")}>
        <ul className="max-w-2xl space-y-2 text-muted-foreground">
          <li>{t("coverClasses")}</li>
          <li>{t("coverStreams")}</li>
        </ul>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          {t("cta")}
        </Link>
      </Section>
    </>
  );
}
