import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarClock, ChevronRight, ClipboardCheck, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireApprovedStudent } from "@/features/auth/guards";
import { listScheduledTests } from "@/features/scheduled/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("test") };
}

/** First step of taking a test: practice at your own pace, or a scheduled test at a fixed time. */
export default async function TestsChooserPage() {
  const profile = await requireApprovedStudent();
  const t = await getTranslations("tests.chooser");
  const entries = await listScheduledTests({ studentId: profile.id });

  const live = entries.filter((e) => e.phase === "live" && e.attempt?.status !== "submitted").length;
  const upcoming = entries.filter((e) => e.phase === "upcoming").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/tests/practice" className="group block h-full rounded-card">
            <Card className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:bg-surface-muted">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <ClipboardCheck className="size-6" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("practice.title")}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("practice.body")}</p>
              </div>
              <span className={buttonVariants({ size: "lg", className: "mt-auto w-full" })}>
                {t("practice.action")}
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Card>
          </Link>
        </li>
        <li>
          <Link href="/tests/scheduled" className="group block h-full rounded-card">
            <Card className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:bg-surface-muted">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
                  <CalendarClock className="size-6" aria-hidden />
                </span>
                {live > 0 ? (
                  <Badge tone="success" className="gap-1.5">
                    <Radio className="size-3.5" aria-hidden />
                    {t("scheduled.live", { count: live })}
                  </Badge>
                ) : upcoming > 0 ? (
                  <Badge tone="accent">{t("scheduled.upcoming", { count: upcoming })}</Badge>
                ) : null}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("scheduled.title")}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("scheduled.body")}</p>
              </div>
              <span
                className={buttonVariants({ variant: "outline", size: "lg", className: "mt-auto w-full" })}
              >
                {t("scheduled.action")}
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Card>
          </Link>
        </li>
      </ul>
    </div>
  );
}
