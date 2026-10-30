"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Volume1, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanSpeak } from "../hooks";
import { speak } from "../speech";

/** "Listen" and "Slowly" buttons that read a phrase aloud. Hidden on devices with no speech. */
export function ListenButtons({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const t = useTranslations("spoken.audio");
  const canSpeak = useCanSpeak();
  const [playing, setPlaying] = useState<"normal" | "slow" | null>(null);

  if (!canSpeak) return null;

  const play = async (slow: boolean) => {
    setPlaying(slow ? "slow" : "normal");
    await speak(text, { slow });
    setPlaying(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size={size} onClick={() => void play(false)} aria-pressed={playing === "normal"}>
        <Volume2 className="size-4" aria-hidden />
        {t("listen")}
      </Button>
      <Button variant="outline" size={size} onClick={() => void play(true)} aria-pressed={playing === "slow"}>
        <Volume1 className="size-4" aria-hidden />
        {t("slowly")}
      </Button>
    </div>
  );
}
