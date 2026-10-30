import { useTranslations } from "next-intl";
import {
  Flame,
  MessageCircle,
  Mic,
  Sparkles,
  Gem,
  GraduationCap,
  Medal,
  Rocket,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { BADGES, type BadgeKey } from "@/lib/badges";
import { cn } from "@/lib/utils";

const icons: Record<BadgeKey, LucideIcon> = {
  first_test: Rocket,
  five_tests: Medal,
  ten_tests: Trophy,
  high_scorer: Star,
  perfect_score: Gem,
  streak_7: Flame,
  course_complete: GraduationCap,
  spoken_first: Mic,
  spoken_ten: MessageCircle,
  spoken_streak_3: Sparkles,
};

/** Every badge, with the ones the student has earned in colour and the rest greyed out. */
export function BadgesCard({ earned }: { earned: BadgeKey[] }) {
  const t = useTranslations("badges");
  const have = new Set(earned);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((badge) => {
          const Icon = icons[badge];
          const owned = have.has(badge);
          return (
            <li key={badge}>
              <Card
                className={cn("flex h-full flex-col items-center gap-2 p-3 text-center", !owned && "opacity-55")}
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full",
                    owned ? "bg-accent-soft text-accent-foreground" : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="text-sm font-semibold leading-tight">{t(`items.${badge}.name`)}</p>
                <p className="text-xs leading-snug text-muted-foreground">
                  {t(`items.${badge}.description`)}
                </p>
                <span className="sr-only">{owned ? t("earned") : t("locked")}</span>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
