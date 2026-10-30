"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CloudOff, RefreshCw, Trash2, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  deleteTest,
  listOutbox,
  listTests,
  offlineStorageAvailable,
  type OfflineTest,
} from "@/lib/offline/db";
import { useOnline } from "../hooks";
import { syncOutbox } from "../sync";

const subscribeNothing = () => () => {};

/** The tests saved on this phone, with their sync status. Works with no internet at all. */
export function OfflineTestsList({ userId }: { userId: string }) {
  const t = useTranslations("offlineTests");
  const online = useOnline();
  const supported = useSyncExternalStore(subscribeNothing, offlineStorageAvailable, () => false);
  const [tests, setTests] = useState<OfflineTest[] | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [syncing, setSyncing] = useState(false);
  // Bumped after a delete or a sync, to read the saved data again.
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const [saved, outbox] = await Promise.all([listTests(userId), listOutbox(userId)]);
        if (cancelled) return;
        setTests(saved);
        setWaiting(outbox.filter((item) => item.status === "pending").length);
      } catch {
        if (!cancelled) setTests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, userId, reload]);

  const syncNow = async () => {
    setSyncing(true);
    await syncOutbox(userId).catch(() => {});
    setReload((value) => value + 1);
    setSyncing(false);
  };

  if (!supported) {
    return <EmptyState icon={CloudOff} title={t("unsupportedTitle")} description={t("unsupportedBody")} />;
  }

  return (
    <div className="space-y-4">
      <Card
        className={online ? "flex items-center gap-3 border-success bg-success-soft" : "flex items-center gap-3 border-accent bg-accent-soft"}
      >
        {online ? (
          <Wifi className="size-5 shrink-0 text-success" aria-hidden />
        ) : (
          <CloudOff className="size-5 shrink-0 text-accent-foreground" aria-hidden />
        )}
        <p role="status" className="flex-1 text-sm font-medium">
          {online ? t("online") : t("offlineNow")}
        </p>
      </Card>

      {waiting > 0 && (
        <Card className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("waitingTitle", { count: waiting })}</p>
            <p className="text-sm text-muted-foreground">{t("waitingBody")}</p>
          </div>
          <Button size="sm" onClick={() => void syncNow()} disabled={!online || syncing}>
            <RefreshCw className="size-4" aria-hidden />
            {syncing ? t("syncing") : t("syncNow")}
          </Button>
        </Card>
      )}

      {tests === null ? null : tests.length === 0 ? (
        <EmptyState
          icon={CloudOff}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={
            <Link href="/tests" className={buttonVariants({ variant: "outline" })}>
              {t("browseTests")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {tests.map((test) => (
            <li key={test.id}>
              <Card className="flex items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{test.topic}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="primary">{test.subject}</Badge>
                    <Badge>{t("meta", { count: test.questions.length, minutes: test.durationMinutes })}</Badge>
                  </div>
                </div>
                <Link
                  href={`/tests/offline/run?id=${test.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  {t("start")}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("remove")}
                  onClick={async () => {
                    await deleteTest(userId, test.id).catch(() => {});
                    setReload((value) => value + 1);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
