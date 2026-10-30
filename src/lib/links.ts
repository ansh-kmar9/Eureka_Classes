import { parseYouTubeId } from "./youtube";

export type LinkKind = "youtube" | "pdf" | "external";

/** How a teacher-supplied link should be shown: in our player, in our PDF viewer, or elsewhere. */
export function getLinkKind(url: string): LinkKind {
  if (parseYouTubeId(url)) return "youtube";
  try {
    if (new URL(url).pathname.toLowerCase().endsWith(".pdf")) return "pdf";
  } catch {
    // Not a valid URL: treat as external.
  }
  return "external";
}
