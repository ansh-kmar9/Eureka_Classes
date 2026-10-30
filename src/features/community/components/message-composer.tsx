"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POST_MAX_LENGTH } from "../limits";

type Outcome = { ok: boolean; error?: "invalid" | "tooFast" | "generic" };

/** A text box with a send button, used for new messages and for replies. */
export function MessageComposer({
  placeholder,
  onSend,
  autoFocus = false,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<Outcome>;
  autoFocus?: boolean;
}) {
  const t = useTranslations("community");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  return (
    <form onSubmit={send} className="space-y-1.5">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={POST_MAX_LENGTH}
          rows={2}
          autoFocus={autoFocus}
          disabled={pending}
          className="min-h-12 w-full resize-none rounded-control border border-border bg-surface px-3.5 py-2.5 text-base placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t("send")}
          disabled={pending || !body.trim()}
          className="shrink-0"
        >
          <SendHorizontal className="size-5" aria-hidden />
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${error as "generic"}`)}
        </p>
      )}
    </form>
  );
}
