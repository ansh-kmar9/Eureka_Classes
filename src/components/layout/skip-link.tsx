import { useTranslations } from "next-intl";

/** The first thing a keyboard user tabs to: jumps straight past the header to the page content. */
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#main"
      className="sr-only fixed left-3 top-3 z-[100] rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground focus:not-sr-only"
    >
      {t("skipToContent")}
    </a>
  );
}
