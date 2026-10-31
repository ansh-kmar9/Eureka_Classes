import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BOARD_VALUES,
  CLASS_VALUES,
  needsStream,
  STREAM_VALUES,
} from "@/features/profile/schemas";
import { cn } from "@/lib/utils";
import type { CatalogScope } from "@/features/tests/queries";
import { scopeHref } from "../scope";

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 min-w-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-surface text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/** Board, class and stream pickers for the teacher's catalog manager. Plain links, no JavaScript needed. */
export function ScopeFilter({ basePath, scope }: { basePath: string; scope: CatalogScope }) {
  const t = useTranslations("catalog");
  const boards = useTranslations("boards");
  const streams = useTranslations("streams");

  const row = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <nav aria-label={label}>
        <ul className="flex flex-wrap gap-2">{children}</ul>
      </nav>
    </div>
  );

  return (
    <div className="space-y-3">
      {row(
        t("board"),
        BOARD_VALUES.map((board) => (
          <li key={board}>
            <Chip href={scopeHref(basePath, { ...scope, board })} active={scope.board === board}>
              {boards(board)}
            </Chip>
          </li>
        )),
      )}
      {row(
        t("class"),
        CLASS_VALUES.map((value) => (
          <li key={value}>
            <Chip
              href={scopeHref(basePath, { ...scope, class: Number(value), stream: null })}
              active={scope.class === Number(value)}
            >
              {value}
            </Chip>
          </li>
        )),
      )}
      {needsStream(scope.class) &&
        row(
          t("stream"),
          [null, ...STREAM_VALUES].map((stream) => (
            <li key={stream ?? "all"}>
              <Chip href={scopeHref(basePath, { ...scope, stream })} active={scope.stream === stream}>
                {stream ? streams(stream) : t("allStreams")}
              </Chip>
            </li>
          )),
        )}
    </div>
  );
}
