import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { TestPhase } from "../queries";

const tones = {
  draft: "neutral",
  upcoming: "accent",
  live: "success",
  ended: "neutral",
  cancelled: "danger",
} as const;

export function PhaseBadge({ phase }: { phase: TestPhase }) {
  const t = useTranslations("scheduled.phase");
  return <Badge tone={tones[phase]}>{t(phase)}</Badge>;
}
