"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const SHOW_FOR_MS: Record<Tone, number> = { success: 3500, info: 4500, error: 6000 };
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastApi | null>(null);

/** Short messages that confirm an action or explain a problem, then disappear by themselves. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      // Newest last; the oldest drop off if too many pile up.
      setItems((current) => [...current, { id, message, tone }].slice(-MAX_VISIBLE));
      timers.current.set(id, setTimeout(() => dismiss(id), SHOW_FOR_MS[tone]));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Sits above the mobile bottom navigation and above dialogs. */}
      <div
        role="region"
        aria-label={t("notifications")}
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((item) => {
          const Icon = item.tone === "success" ? CircleCheck : item.tone === "error" ? CircleAlert : Info;
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface p-3.5 shadow-lg",
                item.tone === "success" && "border-success",
                item.tone === "error" && "border-danger",
                item.tone === "info" && "border-border",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  item.tone === "success" && "text-success",
                  item.tone === "error" && "text-danger",
                  item.tone === "info" && "text-primary",
                )}
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={t("dismiss")}
                className="-m-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const silent: ToastApi = { success: () => {}, error: () => {}, info: () => {} };

/** Shows a toast. Does nothing (instead of crashing) if used outside the provider. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? silent;
}
