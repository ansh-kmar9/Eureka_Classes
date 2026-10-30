import Link from "next/link";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import type { StudentStatus } from "@/lib/supabase/types";
import { STATUS_FILTERS, type StudentFilters } from "../queries";

const STREAMS = ["science", "commerce", "arts"] as const;

export function studentsHref(
  filters: Partial<Omit<StudentFilters, "class" | "stream" | "status">> & {
    class?: number | null;
    stream?: string | null;
    status?: string | null;
  },
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.class) params.set("class", String(filters.class));
  if (filters.stream) params.set("stream", filters.stream);
  if (filters.status) params.set("status", filters.status);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/teacher?${query}` : "/teacher";
}

/** Status tabs plus a collapsible search and filter form. Works without JavaScript. */
export function StudentFilterBar({
  filters,
  counts,
}: {
  filters: StudentFilters;
  counts: Record<StudentStatus, number>;
}) {
  const t = useTranslations("students");
  const common = useTranslations("common");
  const streams = useTranslations("streams");

  const tabs: { key: StudentStatus | null; count: number }[] = [
    { key: null, count: counts.pending + counts.approved + counts.blocked },
    ...STATUS_FILTERS.filter((status) => status !== "incomplete").map((status) => ({
      key: status,
      count: counts[status],
    })),
    { key: "incomplete", count: counts.incomplete },
  ];

  const hasFilters = Boolean(filters.q || filters.class || filters.stream);

  return (
    <div className="space-y-3">
      <nav aria-label={t("statusTabs")} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {tabs.map(({ key, count }) => {
            const active = filters.status === key;
            return (
              <li key={key ?? "all"}>
                <Link
                  href={studentsHref({ ...filters, status: key, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  {key ? t(`tabs.${key}`) : t("tabs.all")}
                  <span className="text-xs opacity-80">{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <details className="group rounded-card border border-border bg-surface" open={hasFilters}>
        <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium">
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("filters")}
          {hasFilters && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        </summary>
        <form method="get" action="/teacher" className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <div className="sm:col-span-2 lg:col-span-4">
            <Label htmlFor="q">{t("search")}</Label>
            <Input id="q" name="q" type="search" defaultValue={filters.q} />
          </div>
          <div>
            <Label htmlFor="class">{t("class")}</Label>
            <Select id="class" name="class" defaultValue={filters.class ?? ""}>
              <option value="">{t("allClasses")}</option>
              {site.classes.map((n) => (
                <option key={n} value={n}>
                  {common("classLabel", { n })}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="stream">{t("stream")}</Label>
            <Select id="stream" name="stream" defaultValue={filters.stream ?? ""}>
              <option value="">{t("allStreams")}</option>
              {STREAMS.map((stream) => (
                <option key={stream} value={stream}>
                  {streams(stream)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit">{t("apply")}</Button>
            {hasFilters && (
              <Link
                href={studentsHref({ status: filters.status })}
                className="flex h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t("clear")}
              </Link>
            )}
          </div>
        </form>
      </details>
    </div>
  );
}
