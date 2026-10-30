import {
  BOARD_VALUES,
  CLASS_VALUES,
  needsStream,
  STREAM_VALUES,
} from "@/features/profile/schemas";
import type { BoardType, StreamType } from "@/lib/supabase/types";
import type { CatalogScope } from "@/features/tests/queries";

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads ?board=&class=&stream= from the URL, falling back to a sensible default (CBSE, class 10). */
export function parseCatalogScope(params: Params): CatalogScope {
  const board = first(params.board);
  const klass = first(params.class);
  const stream = first(params.stream);

  const cls = (CLASS_VALUES as readonly string[]).includes(klass ?? "") ? Number(klass) : 10;
  return {
    board: (BOARD_VALUES as readonly string[]).includes(board ?? "") ? (board as BoardType) : "cbse",
    class: cls,
    stream:
      needsStream(cls) && (STREAM_VALUES as readonly string[]).includes(stream ?? "")
        ? (stream as StreamType)
        : null,
  };
}

export function scopeHref(basePath: string, scope: CatalogScope) {
  const params = new URLSearchParams({ board: scope.board, class: String(scope.class) });
  if (scope.stream) params.set("stream", scope.stream);
  return `${basePath}?${params.toString()}`;
}
