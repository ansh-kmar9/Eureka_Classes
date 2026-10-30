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

export async function getAnnouncementFeed(
  profile: Pick<Profile, "announcements_seen_at">,
): Promise<AnnouncementFeed> {
  const supabase = await createClient();
  const seenAt = profile.announcements_seen_at ?? null;

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEED_SIZE);

  const items = data ?? [];
  const unread = seenAt
    ? items.filter((item) => item.created_at > seenAt).length
    : items.length;

  return { items, unread, seenAt };
}
