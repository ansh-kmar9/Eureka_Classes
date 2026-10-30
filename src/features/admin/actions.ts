"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/features/auth/guards";
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
