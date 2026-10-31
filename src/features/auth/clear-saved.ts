/** Deletes the pages and PDFs this browser saved for offline use. Called when someone signs out. */
export async function clearSavedCopies() {
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("eureka-pages-") || key === "eureka-docs")
        .map((key) => caches.delete(key)),
    );
  } catch {
    // No Cache API (or blocked): nothing to clear.
  }
}
