import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/features/contact/components/contact-form";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { Section } from "@/features/marketing/components/section";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: { canonical: "/contact" },
  };
}

const channels = [
  {
    key: "call",
    icon: Phone,
    value: site.contact.phone,
    href: `tel:${site.contact.phone.replace(/\s/g, "")}`,
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    value: site.contact.phone,
    href: `https://wa.me/${site.contact.whatsapp}`,
  },
  {
    key: "email",
    icon: Mail,
    value: site.contact.email,
    href: `mailto:${site.contact.email}`,
  },
] as const;

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <>
      <PageIntro title={t("title")} subtitle={t("subtitle")} />
      <Section>
        <ul className="grid gap-3 md:grid-cols-3">
          {channels.map(({ key, icon: Icon, value, href }) => (
            <li key={key}>
              <a href={href} className="block h-full">
                <Card className="flex h-full items-center gap-4 transition-colors hover:bg-surface-muted">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <CardTitle>{t(key)}</CardTitle>
                    <p className="truncate text-sm text-muted-foreground">
                      {value}
                    </p>
                  </div>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0 md:pt-0">
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
