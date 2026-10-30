import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { StudentStatus } from "@/lib/supabase/types";

const tones = {
  incomplete: "neutral",
  pending: "accent",
  approved: "success",
  blocked: "danger",
} as const;

export function StatusBadge({ status }: { status: StudentStatus }) {
  const t = useTranslations("students.status");
  return <Badge tone={tones[status]}>{t(status)}</Badge>;
}
