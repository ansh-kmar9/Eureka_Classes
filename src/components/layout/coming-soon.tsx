import { getTranslations } from "next-intl/server";
import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/** Placeholder for sections that are built in a later phase. */
export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("comingSoon");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <EmptyState icon={Hammer} title={t("title")} description={t("body")} />
    </div>
  );
}
