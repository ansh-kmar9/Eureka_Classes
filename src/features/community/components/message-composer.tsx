"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { POST_MAX_LENGTH } from "../limits";

type Outcome = { ok: boolean; error?: "invalid" | "tooFast" | "generic" };

const MAX_HEIGHT = 160;

/** A text box with a send button, used for new messages and for replies. It grows as you type. */
export function MessageComposer({
  placeholder,
  onSend,
  autoFocus = false,
  compact = false,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<Outcome>;
  autoFocus?: boolean;
  /** A slimmer box, used for replies. */
  compact?: boolean;
}) {
  const t = useTranslations("community");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, MAX_HEIGHT)}px`;
  }, [body]);

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await onSend(body).catch(() => ({ ok: false, error: "generic" as const }));
      if (result.ok) setBody("");
      else setError(result.error ?? "generic");
    });
  };

  const nearLimit = body.length > POST_MAX_LENGTH * 0.8;

  return (
    <form onSubmit={send} className="space-y-1.5">
      <div
        className={cn(
          "flex items-end gap-2 border border-border bg-surface p-1.5 pl-4 transition-colors focus-within:border-primary",
          compact ? "rounded-2xl" : "rounded-3xl",
        )}
      >
        <textarea
          ref={inputRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={POST_MAX_LENGTH}
          rows={1}
          autoFocus={autoFocus}
          disabled={pending}
          className="min-h-11 w-full resize-none bg-transparent py-2.5 text-base placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label={t("send")}
          disabled={pending || !body.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-primary-foreground shadow-sm transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </div>
      {nearLimit && (
        <p className="px-2 text-right text-xs tabular-nums text-muted-foreground">
          {body.length}/{POST_MAX_LENGTH}
        </p>
      )}
      {error && (
        <p role="alert" className="px-2 text-sm text-danger">
          {t(`errors.${error as "generic"}`)}
        </p>
      )}
    </form>
  );
}
