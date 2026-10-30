import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Library } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/features/auth/guards";
import { EnrolmentStatus } from "@/features/enrolment/components/enrolment-status";
import { BadgesCard } from "@/features/dashboard/components/badges-card";
import { RecentResults } from "@/features/dashboard/components/recent-results";
import { SpokenCard } from "@/features/dashboard/components/spoken-card";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { getDashboardStats } from "@/features/dashboard/queries";
import { CourseCard } from "@/features/courses/components/course-card";
import { getCourseSummaries } from "@/features/courses/queries";
import { getSpokenState } from "@/features/spoken/queries";
import { NotificationCard } from "@/features/push/components/notification-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const profile = await requireStudent();
  const t = await getTranslations("dashboard");

  // Pending and blocked students see their enrolment status instead of the dashboard.
  if (profile.status !== "approved") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        {profile.status === "pending" && <NotificationCard />}
        <EnrolmentStatus profile={profile} />
      </div>
    );
  }

  const locale = (await getLocale()) === "hi" ? "hi" : "en";
  const [summaries, stats, spoken] = await Promise.all([
    getCourseSummaries({ studentId: profile.id }),
    getDashboardStats(profile.id),
    getSpokenState(profile.id),
  ]);

  // Courses already started come first, then the rest, capped for a compact dashboard.
  const myCourses = [...summaries]
    .sort((a, b) => Number(b.done > 0) - Number(a.done > 0))
    .slice(0, 3);
  const tiles = [
    { href: "/courses", icon: BookOpen, label: t("tiles.courses") },
    { href: "/study-material", icon: Library, label: t("tiles.materials") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("greeting", { name: profile.full_name?.split(" ")[0] ?? "" })}
      </h1>

      <NotificationCard />

      <StatsGrid stats={stats} />

      <SpokenCard state={spoken} locale={locale} />

      <ul className="grid grid-cols-2 gap-3">
        {tiles.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link href={href} className="block rounded-card">
              <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {myCourses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("myCourses")}</h2>
            <Link href="/courses" className="text-sm font-medium text-primary">
              {t("viewAll")}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((summary) => (
              <li key={summary.course.id}>
                <CourseCard summary={summary} href={`/courses/${summary.course.id}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentResults results={stats.recent} />

      <BadgesCard earned={stats.earnedBadges} />
    </div>
  );
}
