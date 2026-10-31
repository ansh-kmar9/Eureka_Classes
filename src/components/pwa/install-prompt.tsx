"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

/** Chromium's install event. It is not in the standard DOM typings. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "eureka:install-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 2500;

// Screens where nothing should cover the page: a running test, or signing in.
const QUIET_PATHS = [/\/take$/, /^\/tests\/offline\/run/, /^\/auth\//, /^\/login/];

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isSnoozed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Boolean(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Private mode: it will simply ask again next visit.
  }
}

/**
 * Invites phone visitors to add the site to their home screen, which is what makes it install as an app.
 * Android (Chrome, Brave, Edge, Samsung) gets a one-tap Install button; iPhones and Firefox have no such
 * button, so they get the two or three taps to do it by hand. Nothing shows once the app is installed.
 */
export function InstallPrompt() {
  const t = useTranslations("install");
  const pathname = usePathname();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "firefox" | "other">("other");
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Phones and tablets only. Desktop browsers already have their own install icon.
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setEvent(null);
      setDismissed(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Wait a moment, so the page is usable first and the install event has had time to arrive.
    const timer = window.setTimeout(() => {
      if (isInstalled() || isSnoozed()) return;
      const ua = navigator.userAgent;
      const ios =
        /iphone|ipad|ipod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setPlatform(ios ? "ios" : /firefox/i.test(ua) ? "firefox" : "other");
      setReady(true);
    }, SHOW_AFTER_MS);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Other Chromium browsers without the event are either already installed or cannot install: say nothing.
  const mode = event ? "install" : platform === "other" ? null : platform;
  if (!ready || dismissed || !mode || QUIET_PATHS.some((re) => re.test(pathname))) return null;

  function close() {
    snooze();
    setDismissed(true);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    if (outcome === "accepted") setDismissed(true);
    else close();
  }

  const steps =
    mode === "ios"
      ? [t("iosStep1"), t("iosStep2"), t("iosStep3")]
      : mode === "firefox"
        ? [t("manualStep1"), t("manualStep2"), t("manualStep3")]
        : null;

  return (
    <aside
      aria-label={t("title")}
      className="pb-safe fixed inset-x-3 bottom-[4.75rem] z-50 mx-auto max-w-md rounded-card border border-border bg-surface p-4 shadow-lg md:inset-x-auto md:bottom-4 md:right-4"
    >
      <div className="flex items-start gap-3">
        <BrandMark className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{mode === "ios" ? t("iosTitle") : t("title")}</p>
          {steps ? (
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      {mode === "install" && (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={install}>
            <Download className="size-4" aria-hidden />
            {t("install")}
          </Button>
          <Button variant="outline" onClick={close}>
            {t("later")}
          </Button>
        </div>
      )}
    </aside>
  );
}
