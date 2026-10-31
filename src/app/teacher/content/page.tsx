import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Library, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("teacherNav");
  return { title: t("content") };
}

/** First step of adding content: ask what is being uploaded, then open the matching screen. */
export default async function ContentChooserPage() {
  const t = await getTranslations("content.chooser");

  const choices = [
    {
      key: "course",
      icon: BookOpen,
      newHref: "/teacher/content/courses/new",
      listHref: "/teacher/content/courses",
    },
    {
      key: "material",
      icon: Library,
      newHref: "/teacher/content/materials/new",
      listHref: "/teacher/content/materials",
    },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {choices.map(({ key, icon: Icon, newHref, listHref }) => (
          <li key={key}>
            <Card className="flex h-full flex-col gap-4 p-5">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t(`${key}.title`)}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`${key}.body`)}</p>
              </div>
              <div className="mt-auto space-y-1">
                <Link href={newHref} className={buttonVariants({ size: "lg", className: "w-full" })}>
                  <Plus className="size-5" aria-hidden />
                  {t(`${key}.action`)}
                </Link>
                <Link
                  href={listHref}
                  className="flex h-11 items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t(`${key}.manage`)}
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
