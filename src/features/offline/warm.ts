/** The pages that must keep working with no connection. */
export const OFFLINE_PAGES = ["/tests/offline", "/tests/offline/run", "/tests/offline/result"];

/**
 * Asks the service worker to download the offline pages and their scripts now, while there is
 * a connection, so they open later without one. Safe to call when there is no service worker.
 */
export async function warmOfflinePages(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  registration?.active?.postMessage({ type: "warm", urls: OFFLINE_PAGES });
}
