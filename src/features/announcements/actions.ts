"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { getCurrentProfile } from "@/features/auth/queries";
import { pushMessages } from "@/lib/push/messages";
import { sendPushToStudents } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "./schemas";

type Result = { ok: boolean };

export async function createAnnouncement(input: unknown): Promise<Result> {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success || !(await getStaff())) return { ok: false };

  // created_by defaults to the signed-in user in the database.
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert(parsed.data);
  if (error) return { ok: false };

  // Tell every approved student on their phone. Failures here never block publishing.
  await sendPushToStudents(pushMessages.announcement(parsed.data.title, parsed.data.body));

  revalidatePath("/teacher/announcements");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  if (!(await getStaff()) || !z.uuid().safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  revalidatePath("/teacher/announcements");
  revalidatePath("/dashboard");
  return { ok: !error };
}

/** Called when a student opens the announcements list, so the unread dot clears. */
export async function markAnnouncementsSeen(): Promise<Result> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ announcements_seen_at: new Date().toISOString() })
    .eq("id", profile.id);

  return { ok: !error };
}
