"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean };

const idSchema = z.uuid();

/** Promotes a user who has signed in at least once, or returns a teacher to a student account. */
export async function setTeacherRole(userId: string, makeTeacher: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin || !idSchema.safeParse(userId).success || userId === admin.id) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  // The admin account can never be changed from here.
  if (!target || target.role === "admin") return { ok: false };

  const { error } = await supabase
    .from("profiles")
    .update(
      makeTeacher
        ? { role: "teacher", status: "approved" }
        // A removed teacher starts again as a student, with a fresh profile to fill in.
        : { role: "student", status: "incomplete" },
    )
    .eq("id", userId);

  revalidatePath("/admin");
  return { ok: !error };
}

export async function markMessageRead(id: string, isRead: boolean): Promise<Result> {
  if (!(await getAdmin()) || !idSchema.safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: isRead })
    .eq("id", id);

  revalidatePath("/admin/messages");
  return { ok: !error };
}

export async function deleteMessage(id: string): Promise<Result> {
  if (!(await getAdmin()) || !idSchema.safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);

  revalidatePath("/admin/messages");
  return { ok: !error };
}

/** Tables whose rows would be wiped along with their creator if the account were deleted as is. */
const CONTENT_TABLES = [
  "announcements",
  "courses",
  "study_materials",
  "practice_tests",
  "scheduled_tests",
] as const;

/**
 * Permanently deletes a student or teacher: their sign-in and everything linked to it
 * (profile, results, progress, badges, notifications and community messages). It cannot be undone.
 *
 * Only the admin may do this, never to themselves or to another admin. When a teacher is deleted,
 * the courses, tests, material and announcements they created are first handed to the admin,
 * so removing a person never removes content that students are using.
 */
export async function deleteUserPermanently(userId: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin || !idSchema.safeParse(userId).success || userId === admin.id) return { ok: false };

  const service = createAdminClient();
  const { data: target } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  // The admin account is never deletable from here; neither is an account that does not exist.
  if (!target || target.role === "admin") return { ok: false };

  if (target.role === "teacher") {
    for (const table of CONTENT_TABLES) {
      const { error } = await service
        .from(table)
        .update({ created_by: admin.id })
        .eq("created_by", userId);
      // If any hand-over fails, stop before deleting anything.
      if (error) return { ok: false };
    }
  }

  // Deleting the sign-in removes the profile, and the profile's links remove the rest.
  const { error } = await service.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
  revalidatePath("/teacher");
  return { ok: !error };
}
