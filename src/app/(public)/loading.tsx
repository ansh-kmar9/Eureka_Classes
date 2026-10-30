import { useTranslations } from "next-intl";
import { PageLoader } from "@/components/ui/page-loader";

/** Shown inside the page frame while the next screen loads, so the header and menu stay put. */
export default function SectionLoading() {
  const t = useTranslations("common");
  return <PageLoader label={t("loading")} />;
}
