import { useTranslations } from "next-intl";
import { PageSkeleton } from "@/components/ui/page-skeleton";

/** Shown inside the page frame while the next screen loads, so the header and menu stay put. */
export default function SectionLoading() {
  const t = useTranslations("common");
  return <PageSkeleton label={t("loading")} />;
}
