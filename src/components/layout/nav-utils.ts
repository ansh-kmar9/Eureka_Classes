import type { NavItem } from "./icons";

/**
 * The nav item that best matches the current page: the longest href that is the
 * path itself or one of its parents. This stops "/teacher" lighting up on every
 * page under /teacher.
 */
export function getActiveHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    const matches = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}
