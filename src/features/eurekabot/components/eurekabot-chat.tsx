"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, RotateCcw, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SimpleMarkdown } from "@/components/ui/simple-markdown";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "model";
  text: string;
}

type BotError = "busy" | "rateLimited" | "unavailable" | "generic";

const MAX_LENGTH = 2000;
/** How much of the conversation is sent back each time, to keep requests small. */
const CONTEXT_TURNS = 20;

/**
 * Chat with EurekaBot. Messages live only in this component's memory: leaving the page,
 * refreshing or tapping "New chat" starts a fresh conversation, as intended.
 */
export function EurekaBotChat() {
  const t = useTranslations("bot");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<BotError | null>(null);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, thinking, error]);

  const ask = async (history: Message[]) => {
    setThinking(true);
    setError(null);
    try {
      const response = await fetch("/api/eurekabot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-CONTEXT_TURNS).map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };

      if (response.ok && data.reply) {
        setMessages([...history, { id: nextId.current++, role: "model", text: data.reply }]);
      } else {
        const known: BotError[] = ["busy", "rateLimited", "unavailable"];
        setError(known.includes(data.error as BotError) ? (data.error as BotError) : "generic");
      }
    } catch {
      setError("generic");
    } finally {
      setThinking(false);
    }
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    const history = [...messages, { id: nextId.current++, role: "user" as const, text: clean }];
    setMessages(history);
    setDraft("");
    void ask(history);
  };

  const newChat = () => {
    setMessages([]);
    setError(null);
    setDraft("");
  };

  const suggestions = [t("suggestions.one"), t("suggestions.two"), t("suggestions.three")];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Bot className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={newChat}>
            <RotateCcw className="size-4" aria-hidden />
            {t("newChat")}
          </Button>
        )}
      </div>

      <div className="space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed">{t("welcome")}</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-3 text-[15px]",
                message.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border bg-surface",
              )}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              ) : (
                <SimpleMarkdown text={message.text} />
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <p
              role="status"
              className="animate-pulse rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground"
            >
              {t("thinking")}
            </p>
          </div>
        )}

        {error && (
          <Card className="space-y-3 border-danger bg-danger-soft">
            <p role="alert" className="text-sm font-medium text-danger">
              {t(`errors.${error}`)}
            </p>
            {error !== "rateLimited" && error !== "unavailable" && (
              <Button size="sm" onClick={() => void ask(messages)}>
                {t("retry")}
              </Button>
            )}
          </Card>
        )}
        <div ref={endRef} />
      </div>

      {/* Stays above the mobile bottom navigation. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="sticky bottom-[4.5rem] flex items-end gap-2 rounded-card border border-border bg-background/95 p-2 backdrop-blur md:bottom-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter adds a new line.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send(draft);
            }
          }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          maxLength={MAX_LENGTH}
          rows={1}
          className="max-h-32 min-h-11 w-full resize-none bg-transparent px-2 py-2.5 text-base placeholder:text-muted-foreground/70 focus-visible:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t("send")}
          disabled={thinking || !draft.trim()}
          className="shrink-0"
        >
          <SendHorizontal className="size-5" aria-hidden />
        </Button>
      </form>
      <p className="px-1 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
