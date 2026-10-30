"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { savePushSubscription } from "../actions";

type State =
  | "loading"
  | "unsupported"
  | "needs-install"
  | "ask"
  | "dismissed"
  | "denied"
  | "error"
  | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function subscribe(): Promise<boolean> {
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    8000,
    "Service worker",
  );
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      }),
      15000,
      "Push registration",
    ));

  const { ok } = await savePushSubscription(subscription.toJSON(), navigator.userAgent);
  return ok;
}

function detectState(): State {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  // iPhones only allow web push for apps added to the Home Screen.
  if (isIos && !standalone) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" ? "on" : "ask";
}

const describe = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export function NotificationCard() {
  const t = useTranslations("notifications");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const [state, setState] = useState<State>("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const detected = detectState();
    // Already allowed earlier: quietly make sure this device is registered.
    if (detected === "on") {
      subscribe()
        .then((ok) => ok || setState("error"))
        .catch((error) => {
          setDetail(describe(error));
          setState("error");
        });
    }
    // Reading browser capabilities is only possible after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(detected);
  }, []);

  if (state === "loading" || state === "on" || state === "unsupported") return null;

  const enable = () =>
    startTransition(async () => {
      setDetail(null);
      try {
        const permission = await Notification.requestPermission();
        if (permission === "denied") return setState("denied");
        // The prompt was closed without an answer.
        if (permission !== "granted") return setState("dismissed");

        const subscribed = await subscribe();
        setState(subscribed ? "on" : "error");
        if (subscribed) toast.success(toasts("notificationsOn"));
      } catch (error) {
        // Usually the browser could not reach its push service.
        console.error("Push setup failed:", error);
        setDetail(describe(error));
        setState("error");
      }
    });

  const Icon =
    state === "denied" || state === "error"
      ? BellOff
      : state === "needs-install"
        ? Bell
        : BellRing;

  const message = {
    denied: t("denied"),
    "needs-install": t("iosInstall"),
    dismissed: t("dismissed"),
    error: t("failed"),
    ask: t("body"),
    loading: "",
    unsupported: "",
    on: "",
  }[state];

  return (
    <Card className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">{t("title")}</h2>
        <p role="status" className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {state === "error" && detail && (
          <p className="mt-2 break-words rounded-control bg-surface-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
            {detail}
          </p>
        )}
        {(state === "ask" || state === "dismissed" || state === "error") && (
          <Button className="mt-3" onClick={enable} disabled={pending}>
            {pending ? t("enabling") : t("enable")}
          </Button>
        )}
      </div>
    </Card>
  );
}
