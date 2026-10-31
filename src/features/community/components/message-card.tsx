"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { GraduationCap, Heart, MessageCircle, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/features/students/components/student-card";
import type { CommunityRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { deleteMessage, loadReplies, postMessage, toggleLike } from "../actions";
import { MessageComposer } from "./message-composer";

/**
 * One community message with its like button and (for top-level messages) a thread of replies.
 * `version` changes whenever the feed refreshes, so an open thread reloads along with it.
 */
export function MessageCard({
  row,
  currentUserId,
  canModerate,
  version,
  isReply = false,
  onChanged,
}: {
  row: CommunityRow;
  currentUserId: string;
  canModerate: boolean;
  version: number;
  isReply?: boolean;
  /** Called after something changes that the feed should reload (a reply, a delete). */
  onChanged: () => void;
}) {
  const t = useTranslations("community");
  const toasts = useTranslations("toasts");
  const common = useTranslations("common");
  const format = useFormatter();

  const [liked, setLiked] = useState(row.liked_by_me);
  const [likes, setLikes] = useState(row.like_count);
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<CommunityRow[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  // Follow the server when the feed refreshes (someone else liked it, for example).
  const [seen, setSeen] = useState({ liked: row.liked_by_me, likes: row.like_count });
  if (seen.liked !== row.liked_by_me || seen.likes !== row.like_count) {
    setSeen({ liked: row.liked_by_me, likes: row.like_count });
    setLiked(row.liked_by_me);
    setLikes(row.like_count);
  }

  const fetchReplies = useCallback(async () => {
    setReplies(await loadReplies(row.id));
    setRepliesLoaded(true);
  }, [row.id]);

  // Load the thread when it opens, and again whenever the feed refreshes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const data = await loadReplies(row.id);
      if (cancelled) return;
      setReplies(data);
      setRepliesLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, version, row.id]);

  const like = async () => {
    // Update at once; put it back if the server says no.
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((count) => count + (wasLiked ? -1 : 1));
    const result = await toggleLike(row.id).catch(() => ({ ok: false as const }));
    if (result.ok) {
      setLiked(result.liked);
      setLikes(result.count);
    } else {
      setLiked(wasLiked);
      setLikes((count) => count + (wasLiked ? 1 : -1));
    }
  };

  const canDelete = canModerate || row.author_id === currentUserId;
  const isStaff = row.author_role !== "student";

  return (
    <article
      className={cn(
        "space-y-3",
        isReply
          ? "py-3"
          : "rounded-2xl border p-4 shadow-sm",
        !isReply && (isStaff ? "border-primary/40 bg-gradient-to-br from-primary-soft to-surface" : "border-border bg-surface"),
      )}
    >
      <header className="flex items-start gap-3">
        <StudentAvatar
          student={{ full_name: row.author_name, email: row.author_name, avatar_url: row.author_avatar }}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="break-words font-semibold">{row.author_name}</span>
            {isStaff && (
              <Badge tone="primary" className="gap-1">
                <GraduationCap className="size-3.5" aria-hidden />
                {t("teacher")}
              </Badge>
            )}
            {!isStaff && row.author_class && (
              <span className="text-xs text-muted-foreground">
                {common("classLabel", { n: row.author_class })}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {format.relativeTime(new Date(row.created_at))}
          </p>
        </div>
        {canDelete && (
          <ActionButton
            size="icon"
            variant="ghost"
            aria-label={t("delete")}
            successMessage={toasts("messageDeleted")}
            action={async () => {
              const result = await deleteMessage(row.id);
              if (result.ok) onChanged();
              return result;
            }}
            confirm={{
              title: t("deleteTitle"),
              description: isReply ? t("deleteReplyBody") : t("deleteBody"),
              confirmLabel: t("delete"),
              cancelLabel: t("cancel"),
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </ActionButton>
        )}
      </header>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{row.body}</p>

      <footer className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => void like()}
          aria-pressed={liked}
          aria-label={liked ? t("unlike") : t("like")}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full px-3.5 font-medium transition-colors",
            liked ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className="size-4" fill={liked ? "currentColor" : "none"} aria-hidden />
          <span className="tabular-nums">{likes}</span>
        </button>

        {!isReply && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex h-10 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" aria-hidden />
            {row.reply_count > 0 ? t("replies", { count: row.reply_count }) : t("reply")}
          </button>
        )}
      </footer>

      {!isReply && open && (
        <div className="space-y-3 border-l-2 border-primary/30 pl-3 sm:pl-4">
          {repliesLoaded && replies.length > 0 && (
            <ul className="divide-y divide-border">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <MessageCard
                    row={reply}
                    currentUserId={currentUserId}
                    canModerate={canModerate}
                    version={version}
                    isReply
                    onChanged={() => {
                      void fetchReplies();
                      onChanged();
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          <MessageComposer
            placeholder={t("replyPlaceholder")}
            compact
            autoFocus={replies.length === 0}
            onSend={async (body) => {
              const result = await postMessage({ body, parentId: row.id });
              if (result.ok) {
                await fetchReplies();
                onChanged();
              }
              return result;
            }}
          />
        </div>
      )}
    </article>
  );
}
