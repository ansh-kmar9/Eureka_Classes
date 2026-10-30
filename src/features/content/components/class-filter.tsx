import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/** Scrollable "All, 6, 7 ... 12" chips. Selecting one reloads the page with ?class=. */
export function ClassFilter({
  basePath,
  selected,
}: {
  basePath: string;
  selected: number | null;
}) {
  const t = useTranslations("content");
  const options: (number | null)[] = [null, ...site.classes];

  return (
    <nav aria-label={t("class")} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-2">
        {options.map((value) => (
          <li key={value ?? "all"}>
            <Link
              href={value ? `${basePath}?class=${value}` : basePath}
              aria-current={selected === value ? "page" : undefined}
              className={cn(
                "flex h-10 min-w-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                selected === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {value ?? t("filterAll")}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function parseClassParam(value: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 6 && n <= 12 ? n : null;
}
