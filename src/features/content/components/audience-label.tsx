import { useTranslations } from "next-intl";
import type { StreamType } from "@/lib/supabase/types";

/** "Class 11 · Science", or "Class 11 · All streams" for senior content open to every stream. */
export function AudienceLabel({
  classNumber,
  stream,
}: {
  classNumber: number;
  stream: StreamType | null;
}) {
  const common = useTranslations("common");
  const streams = useTranslations("streams");
  const content = useTranslations("content");

  const parts = [common("classLabel", { n: classNumber })];
  if (classNumber >= 11) parts.push(stream ? streams(stream) : content("allStreams"));
  return <>{parts.join(" · ")}</>;
}
