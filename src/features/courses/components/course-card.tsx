import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AudienceLabel } from "@/features/content/components/audience-label";
import type { CourseSummary } from "../queries";

export function CourseCard({
  summary,
  href,
  showProgress = true,
  showAudience = false,
}: {
  summary: CourseSummary;
  href: string;
  showProgress?: boolean;
  showAudience?: boolean;
}) {
  const t = useTranslations("courses");
  const { course, subject, total, done } = summary;

  return (
    <Link href={href} className="block rounded-card">
      <Card className="flex h-full flex-col gap-3 transition-colors hover:bg-surface-muted">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <Badge tone="primary">{subject}</Badge>
              {showAudience && (
                <Badge>
                  <AudienceLabel classNumber={course.class} stream={course.stream} />
                </Badge>
              )}
            </div>
            <h3 className="font-semibold leading-snug">{course.title}</h3>
            {course.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        {showProgress ? (
          <div className="mt-auto space-y-1.5">
            <ProgressBar value={done} max={total} label={course.title} />
            <p className="text-xs text-muted-foreground">
              {total === 0 ? t("noLessons") : t("progress", { done, total })}
            </p>
          </div>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground">{t("lessons", { count: total })}</p>
        )}
      </Card>
    </Link>
  );
}
