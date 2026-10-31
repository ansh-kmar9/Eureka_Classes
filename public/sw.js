/* Eureka Classes service worker: push notifications, offline pages, static asset caching. */

const VERSION = "v4";
const STATIC_CACHE = `eureka-static-${VERSION}`;
const PAGE_CACHE = `eureka-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

// Study-material PDFs the student has opened. Filled by the PDF viewer, not by this worker, and
// kept across worker updates (it is cleared when the student signs out).
const DOCS_CACHE = "eureka-docs";

// Public marketing pages: the same for everyone, so they can be shown from the saved copy.
const PUBLIC_PAGES = ["/", "/about", "/features", "/contact"];
// On a slow connection a saved copy is shown instead of waiting this long for the network.
const SLOW_NETWORK_MS = 3500;

// Pages that must keep working with no connection (downloaded practice tests).
const OFFLINE_PAGES = ["/tests/offline", "/tests/offline/run", "/tests/offline/result"];

// In development (registered as /sw.js?dev=1) nothing is cached: file names are not hashed there
// and would go stale. Push notifications still work.
const DEV = new URL(self.location.href).searchParams.has("dev");

self.addEventListener("install", (event) => {
  event.waitUntil(
    (DEV
      ? Promise.resolve()
      : caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_URL))
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("eureka-") && key !== STATIC_CACHE && key !== PAGE_CACHE && key !== DOCS_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** One cache entry per offline page, whatever the ?id= in the address is. */
const pageKey = (pathname) => new Request(self.location.origin + pathname);

const isOfflinePage = (pathname) => OFFLINE_PAGES.includes(pathname.replace(/\/$/, ""));

const isPublicPage = (pathname) => PUBLIC_PAGES.includes(pathname.replace(/(.)\/$/, "$1"));

async function networkFirst(request, url) {
  const cache = await caches.open(PAGE_CACHE);
  const saved = await cache.match(pageKey(url.pathname));

  const fresh = fetch(request).then((response) => {
    // Only plain successful pages are saved, never redirects or errors.
    if (response.ok && !response.redirected) cache.put(pageKey(url.pathname), response.clone());
    return response;
  });

  if (!saved) {
    return fresh.catch(async () => {
      return (await (await caches.open(STATIC_CACHE)).match(OFFLINE_URL)) ?? Response.error();
    });
  }

  // With a saved copy there is no reason to wait for a slow or missing connection.
  const slow = new Promise((resolve) => setTimeout(() => resolve(saved), SLOW_NETWORK_MS));
  return Promise.race([fresh, slow]).catch(() => saved);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (DEV || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build files and icons never change, so serve them from cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Downloaded-test pages: the network when there is one (and remember it), otherwise the saved copy.
  // Data-only requests Next makes while navigating are left alone; if they fail, Next loads the page normally.
  if (isOfflinePage(url.pathname) && request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(pageKey(url.pathname), copy));
          }
          return response;
        })
        .catch(async () => {
          const saved = await (await caches.open(PAGE_CACHE)).match(pageKey(url.pathname));
          if (saved) return saved;
          return (await (await caches.open(STATIC_CACHE)).match(OFFLINE_URL)) ?? Response.error();
        }),
    );
    return;
  }

  // Public pages: the network when it answers in time (and remember it), otherwise the saved copy.
  if (isPublicPage(url.pathname) && request.mode === "navigate") {
    event.respondWith(networkFirst(request, url));
    return;
  }

  // Every other page is personal, so it comes from the network. Offline, show the fallback page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
  }
});

/**
 * Downloads the offline pages, and the scripts they need, while there is a connection.
 * Without this, the scripts would only be saved if the student happened to open each page online.
 */
async function warm(paths) {
  const pages = await caches.open(PAGE_CACHE);
  const statics = await caches.open(STATIC_CACHE);

  for (const path of paths) {
    if (!isOfflinePage(path)) continue;
    try {
      const response = await fetch(path, { credentials: "same-origin" });
      if (!response.ok) continue;

      const html = await response.clone().text();
      await pages.put(pageKey(path), response);

      const assets = new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || []);
      await Promise.all(
        [...assets].map(async (asset) => {
          if (await statics.match(asset)) return;
          try {
            const file = await fetch(asset);
            if (file.ok) await statics.put(asset, file);
          } catch {
            // A missing file is fetched normally the next time the page loads.
          }
        }),
      );
    } catch {
      // Offline right now: the next download will try again.
    }
  }
}

self.addEventListener("message", (event) => {
  if (DEV || !event.data || event.data.type !== "warm") return;
  event.waitUntil(warm(Array.isArray(event.data.urls) ? event.data.urls : []));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Eureka Classes";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      const existing = windows.find((client) => "navigate" in client);
      if (existing) return existing.navigate(target).then((client) => client && client.focus());
      return self.clients.openWindow(target);
    }),
  );
});
