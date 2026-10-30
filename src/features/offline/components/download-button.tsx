"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CircleCheck, Download, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteTest, getTest, offlineStorageAvailable, saveTest } from "@/lib/offline/db";
import { getOfflineTest } from "@/features/tests/offline-actions";
import { useOnline } from "../hooks";
import { warmOfflinePages } from "../warm";

type State = "checking" | "idle" | "saved";
const subscribeNothing = () => () => {};

/** Saves a practice test on the phone so it can be taken without internet. */
export function DownloadButton({ testId, userId }: { testId: string; userId: string }) {
  const t = useTranslations("offlineTests");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const online = useOnline();
  const supported = useSyncExternalStore(subscribeNothing, offlineStorageAvailable, () => false);
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      const saved = await getTest(userId, testId).catch(() => undefined);
      if (!cancelled) setState(saved ? "saved" : "idle");
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, testId, userId]);

  if (!supported || state === "checking") return null;

  const download = () =>
    startTransition(async () => {
      setError(false);
      try {
        const result = await getOfflineTest(testId);
        if (!result.ok) return setError(true);
        await saveTest({ ...result.test, userId, downloadedAt: Date.now() });
        // Asks the service worker to keep the offline pages and their code on the phone.
        await warmOfflinePages();
        setState("saved");
        toast.success(toasts("downloaded"));
      } catch {
        setError(true);
      }
    });

  const remove = () =>
    startTransition(async () => {
      await deleteTest(userId, testId).catch(() => {});
      setState("idle");
    });

  return (
    <div className="space-y-2">
      {state === "saved" ? (
        <div className="space-y-2 rounded-control bg-success-soft px-3 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CircleCheck className="size-4" aria-hidden />
            {t("saved")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/tests/offline/run?id=${testId}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {t("takeOffline")}
            </Link>
            <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
              <Trash2 className="size-4" aria-hidden />
              {t("remove")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={download} disabled={pending || !online}>
          <Download className="size-4" aria-hidden />
          {pending ? t("downloading") : t("download")}
        </Button>
      )}
      {!online && state === "idle" && <p className="text-sm text-muted-foreground">{t("needInternet")}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t("downloadFailed")}
        </p>
      )}
    </div>
  );
}
