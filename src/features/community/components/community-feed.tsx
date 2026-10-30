"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CommunityRow } from "@/lib/supabase/types";
import { loadFeed, postMessage } from "../actions";
import { MessageCard } from "./message-card";
import { MessageComposer } from "./message-composer";

const PAGE_SIZE = 30;
const POLL_MS = 10_000;

/**
 * Newest messages arrive in `fresh`; older pages the reader has already loaded are kept.
 * Anything inside the fresh range that is missing from it was deleted, so it disappears.
 */
function mergeFeed(fresh: CommunityRow[], previous: CommunityRow[]): CommunityRow[] {
  if (fresh.length < PAGE_SIZE) return fresh;
  const oldestFresh = fresh[fresh.length - 1].created_at;
  return [...fresh, ...previous.filter((row) => row.created_at < oldestFresh)];
}

/** The community: a box to post, then the messages, which refresh by themselves. */
export function CommunityFeed({
  initial,
  currentUserId,
  canModerate,
}: {
  initial: CommunityRow[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const t = useTranslations("community");
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  // Bumped on every refresh so open reply threads reload too.
  const [version, setVersion] = useState(0);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const fresh = await loadFeed();
      setItems((previous) => mergeFeed(fresh, previous));
      setVersion((current) => current + 1);
    } finally {
      refreshing.current = false;
    }
  }, []);

  // Keep the feed live while the page is open and visible.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const loadMore = async () => {
    const last = items[items.length - 1];
    if (!last) return;
    setLoadingMore(true);
    const older = await loadFeed(last.created_at).catch(() => []);
    setItems((previous) => [...previous, ...older.filter((row) => !previous.some((p) => p.id === row.id))]);
    setHasMore(older.length >= PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <MessageComposer
          placeholder={t("placeholder")}
          onSend={async (body) => {
            const result = await postMessage({ body });
            if (result.ok) await refresh();
            return result;
          }}
        />
      </Card>

      {items.length === 0 ? (
        <EmptyState icon={MessagesSquare} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id}>
              <MessageCard
                row={row}
                currentUserId={currentUserId}
                canModerate={canModerate}
                version={version}
                onChanged={() => void refresh()}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? t("loading") : t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
