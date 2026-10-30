"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { pushMessages } from "@/lib/push/messages";
import { sendPushToUsers } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean };

const idSchema = z.uuid();

function refresh(studentId?: string) {
  revalidatePath("/teacher");
  if (studentId) revalidatePath(`/teacher/students/${studentId}`);
}

async function loadStudent(studentId: string) {
  const staff = await getStaff();
  if (!staff || !idSchema.safeParse(studentId).success) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .eq("role", "student")
    .maybeSingle();
  return data ? { supabase, student: data } : null;
}

/** Approves enrolment and tells the student, on their phone, that everything is unlocked. */
export async function approveStudent(studentId: string): Promise<Result> {
  const loaded = await loadStudent(studentId);
  if (!loaded || loaded.student.status === "incomplete") return { ok: false };
  const { supabase, student } = loaded;
  if (student.status === "approved") return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", studentId);
  if (error) return { ok: false };

  // Only the first approval is a "welcome"; a re-approval after a block is not.
  if (!student.approved_at) {
    await sendPushToUsers([studentId], (locale) => pushMessages.welcome(locale));
  }

  refresh(studentId);
  return { ok: true };
}

export async function blockStudent(studentId: string): Promise<Result> {
  const loaded = await loadStudent(studentId);
  if (!loaded || loaded.student.status === "incomplete") return { ok: false };

  const { error } = await loaded.supabase
    .from("profiles")
    .update({ status: "blocked" })
    .eq("id", studentId);

  refresh(studentId);
  return { ok: !error };
}

/** Restores the status the student had before the block. */
export async function unblockStudent(studentId: string): Promise<Result> {
  const loaded = await loadStudent(studentId);
  if (!loaded || loaded.student.status !== "blocked") return { ok: false };

  const { error } = await loaded.supabase
    .from("profiles")
    .update({ status: loaded.student.approved_at ? "approved" : "pending" })
    .eq("id", studentId);

  refresh(studentId);
  return { ok: !error };
}

export async function decideClassChange(
  requestId: string,
  approve: boolean,
): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(requestId).success) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_class_change", {
    request_id: requestId,
    approve,
  });

  refresh();
  revalidatePath("/teacher/requests");
  return { ok: !error };
}
