import { useTranslations } from "next-intl";
import { Award, ClipboardCheck, Percent, Trophy, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BADGES } from "@/lib/badges";
import type { DashboardStats } from "../queries";

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3 sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
        <p className="break-words text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

/** Four headline numbers: tests taken, average score, class rank and badges earned. */
export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("dashboard.stats");
  const dash = "-";

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <li>
        <Stat icon={ClipboardCheck} label={t("tests")} value={String(stats.testsTaken)} />
      </li>
      <li>
        <Stat
          icon={Percent}
          label={t("average")}
          value={stats.averagePercent === null ? dash : `${stats.averagePercent}%`}
        />
      </li>
      <li>
        <Stat icon={Trophy} label={t("rank")} value={stats.rank === null ? dash : `#${stats.rank}`} />
      </li>
      <li>
        <Stat
          icon={Award}
          label={t("badges")}
          value={`${stats.earnedBadges.length}/${BADGES.length}`}
        />
      </li>
    </ul>
  );
}
