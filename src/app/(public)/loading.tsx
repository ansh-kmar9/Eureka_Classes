import { useTranslations } from "next-intl";
import { PageSkeleton } from "@/components/ui/page-skeleton";

/** Shown inside the page frame while the next screen loads, so the header and menu stay put. */
export default function SectionLoading() {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageSkeleton label={t("loading")} />
    </div>
  );
}
