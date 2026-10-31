"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, BookOpenText, Bot, GraduationCap, Mic, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
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
const MAX_INPUT_HEIGHT = 128;

function BotAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-primary-foreground shadow-sm",
        className,
      )}
    >
      <Sparkles className="size-4" />
    </span>
  );
}

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, thinking, error]);

  // The box grows with what is typed, up to a limit, and shrinks again after sending.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [draft]);

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

  const suggestions = [
    { icon: BookOpenText, text: t("suggestions.one") },
    { icon: GraduationCap, text: t("suggestions.two") },
    { icon: Mic, text: t("suggestions.three") },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHero
        icon={Bot}
        title={t("title")}
        subtitle={t("subtitle")}
        status
        actions={
          messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={newChat} className="shrink-0">
              <RotateCcw className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t("newChat")}</span>
              <span className="sr-only sm:hidden">{t("newChat")}</span>
            </Button>
          )
        }
      />

      <div className="space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <section className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <BotAvatar />
              <p className="rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[15px] leading-relaxed shadow-sm">
                {t("welcome")}
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-3">
              {suggestions.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => send(text)}
                    className="flex h-full w-full items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left text-sm font-medium leading-snug shadow-sm transition-colors hover:border-primary hover:bg-primary-soft sm:flex-col sm:gap-2"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-sm">
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-3">
              <BotAvatar />
              <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[15px] shadow-sm">
                <SimpleMarkdown text={message.text} />
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="flex items-start gap-3">
            <BotAvatar />
            <div
              role="status"
              className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3.5 shadow-sm"
            >
              <span className="sr-only">{t("thinking")}</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  aria-hidden
                  className="size-2 animate-bounce rounded-full bg-primary/70"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-3 rounded-2xl border border-danger bg-danger-soft p-4">
            <p role="alert" className="text-sm font-medium text-danger">
              {t(`errors.${error}`)}
            </p>
            {error !== "rateLimited" && error !== "unavailable" && (
              <Button size="sm" onClick={() => void ask(messages)}>
                {t("retry")}
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Stays above the mobile bottom navigation. */}
      <div className="sticky bottom-[4.5rem] z-10 -mx-1 bg-gradient-to-t from-background via-background to-transparent px-1 pb-1 pt-4 md:bottom-0">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex items-end gap-2 rounded-3xl border border-border bg-surface p-2 pl-4 shadow-lg transition-colors focus-within:border-primary"
        >
          <textarea
            ref={inputRef}
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
            className="min-h-11 w-full resize-none bg-transparent py-2.5 text-base placeholder:text-muted-foreground/70 focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label={t("send")}
            disabled={thinking || !draft.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-primary-foreground shadow-md transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </form>
        <p className="mt-2 px-2 text-center text-xs leading-snug text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
