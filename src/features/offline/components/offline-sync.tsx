"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { offlineStorageAvailable } from "@/lib/offline/db";
import { syncOutbox } from "../sync";

/**
 * Sends any offline attempts to the server whenever the student opens the app and whenever
 * the connection comes back. Renders nothing.
 */
export function OfflineSync({ userId }: { userId: string }) {
  const toasts = useTranslations("toasts");
  const toast = useToast();

  useEffect(() => {
    if (!offlineStorageAvailable()) return;

    const sync = () =>
      void syncOutbox(userId)
        .then((summary) => {
          if (summary.sent > 0) toast.success(toasts("synced", { count: summary.sent }));
        })
        .catch(() => {});
    sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
    // The toast helpers are stable for the life of the page; only a different user restarts this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return null;
}
