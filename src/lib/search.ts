/**
 * Keeps only characters that are safe inside a PostgREST filter expression
 * (no commas, parentheses or wildcards), so user input cannot change the query.
 */
export function sanitizeSearch(raw: string | undefined, maxLength = 60): string {
  return (raw ?? "")
    .replace(/[^\p{L}\p{N}\s@.+_-]/gu, "")
    .trim()
    .slice(0, maxLength);
}
