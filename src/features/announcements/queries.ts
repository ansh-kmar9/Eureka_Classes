import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, Profile } from "@/lib/supabase/types";

const FEED_SIZE = 20;

export interface AnnouncementFeed {
  items: Announcement[];
  /** Announcements newer than the last time the student opened the list. */
  unread: number;
  /** ISO time of the last visit; items newer than this are "new". Null if never opened. */
  seenAt: string | null;
}

/** The latest announcements. Needs no profile, so it can load while the profile loads. */
export async function listLatestAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEED_SIZE);
  return data ?? [];
}

export function buildAnnouncementFeed(
  items: Announcement[],
  profile: Pick<Profile, "announcements_seen_at">,
): AnnouncementFeed {
  const seenAt = profile.announcements_seen_at ?? null;
  const unread = seenAt
    ? items.filter((item) => item.created_at > seenAt).length
    : items.length;

  return { items, unread, seenAt };
}
