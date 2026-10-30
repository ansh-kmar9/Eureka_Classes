import { useTranslations } from "next-intl";
import { PageLoader } from "@/components/ui/page-loader";

/** Shown while any page without a more specific loading screen is being prepared. */
export default function RootLoading() {
  const t = useTranslations("common");
  return <PageLoader label={t("loading")} fullscreen />;
}
