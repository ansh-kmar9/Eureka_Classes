import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Bot,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  Mic,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FeatureCard } from "@/features/marketing/components/feature-card";
import { JsonLd } from "@/features/marketing/components/json-ld";
import { Section } from "@/features/marketing/components/section";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { absolute: t("homeTitle") },
    description: t("homeDescription"),
    alternates: { canonical: "/" },
  };
}

const highlights = [
  { key: "tests", icon: ClipboardCheck },
  { key: "offline", icon: WifiOff },
  { key: "courses", icon: BookOpen },
  { key: "community", icon: MessageSquare },
  { key: "bot", icon: Bot },
  { key: "spoken", icon: Mic },
] as const;

const steps = ["one", "two", "three"] as const;

export default async function HomePage() {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const meta = await getTranslations("meta");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: site.name,
          url: site.url,
          description: meta("homeDescription"),
          email: site.contact.email,
          telephone: site.contact.phone,
        }}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-10 md:pt-20">
        <div className="max-w-2xl">
          <Badge tone="primary">{t("badge")}</Badge>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/features"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <Section title={t("classesTitle")} subtitle={t("classesSubtitle")}>
        <ul className="flex flex-wrap gap-2.5">
          {site.classes.map((n) => (
            <li
              key={n}
              className="rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
            >
              {common("classLabel", { n })}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("highlightsTitle")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map(({ key, icon }) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`highlights.${key}.title`)}
              description={t(`highlights.${key}.description`)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("stepsTitle")}>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((key, index) => (
            <li
              key={key}
              className="flex gap-4 rounded-card border border-border bg-surface p-4 sm:p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-foreground">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{t(`steps.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`steps.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground md:py-14">
          <h2 className="text-2xl font-bold md:text-3xl">{t("finalTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md opacity-90">
            {t("finalSubtitle")}
          </p>
          <Link
            href="/login"
            className={buttonVariants({
              size: "lg",
              variant: "secondary",
              className: "mt-6 bg-surface text-foreground hover:bg-surface-muted",
            })}
          >
            {t("ctaPrimary")}
          </Link>
        </div>
      </Section>
    </>
  );
}
