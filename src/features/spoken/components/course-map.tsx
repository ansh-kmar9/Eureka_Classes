import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Lock, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COURSE } from "@/lib/spoken/course";
import { cn } from "@/lib/utils";

/**
 * The whole course as a path. Finished lessons show their stars, the next one is highlighted,
 * and later ones are locked until the one before is done.
 */
export function CourseMap({
  stars,
  unlocked,
  locale,
}: {
  stars: Map<string, number>;
  unlocked: Set<string>;
  locale: "en" | "hi";
}) {
  const t = useTranslations("spoken");

  // The first lesson still to finish; its level is opened by default.
  const currentLevel =
    COURSE.find((level) =>
      level.units.some((unit) => unit.lessons.some((lesson) => !stars.has(lesson.id))),
    )?.id ?? COURSE.length;

  return (
    <div className="space-y-3">
      {COURSE.map((level) => {
        const lessons = level.units.flatMap((unit) => unit.lessons);
        const finished = lessons.filter((lesson) => stars.has(lesson.id)).length;
        const levelLocked = !unlocked.has(lessons[0].id);

        return (
          <Card key={level.id} className="p-0">
            <details className="group" open={level.id === currentLevel}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                    levelLocked ? "bg-surface-muted text-muted-foreground" : "bg-primary-soft text-primary",
                  )}
                >
                  {levelLocked ? <Lock className="size-5" aria-hidden /> : level.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {t("levelName", { level: level.id })}: {level.title[locale]}
                  </p>
                  <p className="break-words text-xs text-muted-foreground">{level.subtitle[locale]}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {finished}/{lessons.length}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>

              <div className="space-y-4 border-t border-border p-4">
                {level.units.map((unit) => (
                  <section key={unit.id} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">{unit.title[locale]}</h3>
                    <ol className="space-y-2">
                      {unit.lessons.map((lesson) => {
                        const earned = stars.get(lesson.id) ?? 0;
                        const open = unlocked.has(lesson.id);
                        const current = open && earned === 0;

                        const body = (
                          <div
                            className={cn(
                              "flex min-h-14 items-center gap-3 rounded-control border px-3 py-2.5",
                              current && "border-primary bg-primary-soft",
                              !current && open && "border-border bg-surface hover:bg-surface-muted",
                              !open && "border-border bg-surface-muted/60 opacity-60",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="break-words font-medium">{lesson.title[locale]}</p>
                              <p className="text-xs text-muted-foreground">
                                {t("phraseCount", { count: lesson.phrases.length })}
                              </p>
                            </div>
                            {!open ? (
                              <Lock className="size-4 text-muted-foreground" aria-label={t("locked")} />
                            ) : earned > 0 ? (
                              <span className="flex" role="img" aria-label={t("starsEarned", { count: earned })}>
                                {[1, 2, 3].map((n) => (
                                  <Star
                                    key={n}
                                    className={cn("size-4", n <= earned ? "fill-accent text-accent" : "text-border")}
                                    aria-hidden
                                  />
                                ))}
                              </span>
                            ) : (
                              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                                {t("start")}
                              </span>
                            )}
                          </div>
                        );

                        return (
                          <li key={lesson.id}>
                            {open ? (
                              <Link href={`/spoken-english/lesson/${lesson.id}`} className="block rounded-control">
                                {body}
                              </Link>
                            ) : (
                              body
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
