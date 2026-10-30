import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

/** Previous / next links. `hrefFor` builds the URL for a page number. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  const t = useTranslations("pagination");
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={t("label")} className="flex items-center justify-between gap-3">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          buttonVariants({ variant: "outline" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}
      >
        {t("previous")}
      </Link>
      <span className="text-sm text-muted-foreground">
        {t("status", { page, pages: pageCount })}
      </span>
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= pageCount}
        className={cn(
          buttonVariants({ variant: "outline" }),
          page >= pageCount && "pointer-events-none opacity-50",
        )}
      >
        {t("next")}
      </Link>
    </nav>
  );
}
