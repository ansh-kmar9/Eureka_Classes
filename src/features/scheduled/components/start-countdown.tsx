"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Hourglass } from "lucide-react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** "Starts in 2h 5m". Refreshes the page the moment the test opens so the Start button appears. */
export function StartCountdown({ startsAt }: { startsAt: string }) {
  const t = useTranslations("scheduled.countdown");
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  const remaining = Date.parse(startsAt) - now;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining <= 0) router.refresh();
  }, [remaining, router]);

  const { days, hours, minutes, seconds } = parts(remaining);
  const label =
    days > 0
      ? t("days", { days, hours })
      : hours > 0
        ? t("hours", { hours, minutes })
        : t("minutes", { minutes, seconds });

  return (
    <p
      role="timer"
      className="flex items-center gap-2 rounded-control bg-accent-soft px-3 py-2.5 text-sm font-semibold text-accent-foreground"
    >
      <Hourglass className="size-4" aria-hidden />
      {t("startsIn", { time: label })}
    </p>
  );
}
