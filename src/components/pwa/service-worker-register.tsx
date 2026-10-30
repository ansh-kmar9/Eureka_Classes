"use client";

import { useEffect } from "react";

/** Registers the service worker once the page has loaded. Renders nothing. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      // In development the worker only handles push; it must not cache files that change constantly.
      .register(process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1", {
        scope: "/",
        updateViaCache: "none",
      })
      .catch(() => {
        // The app works without it; only push and offline features need it.
      });
  }, []);

  return null;
}
