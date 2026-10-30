"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { saveProfilePreference } from "./preferences";
import { revalidatePath } from "next/cache";
import { classChangeSchema, detailsFormSchema, profileFormSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: "generic" | "unauthorized" };

const themeSchema = z.enum(["light", "dark", "system"]);

/** Onboarding: saves the required details and submits the student for approval. */
export async function completeProfile(
  input: unknown,
  theme?: string,
): Promise<ActionResult> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "unauthorized" };
  if (profile.role !== "student" || profile.status !== "incomplete") {
    return { ok: false, error: "generic" };
  }

  const themeResult = themeSchema.safeParse(theme);
  const language = (await getLocale()) === "hi" ? "hi" : "en";
  const { fullName, ...rest } = parsed.data; // rest holds board, class, stream, age, mobile

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      ...rest,
      language,
      ...(themeResult.success ? { theme: themeResult.data } : {}),
      status: "pending",
    })
    .eq("id", profile.id)
    .eq("status", "incomplete");

  return error ? { ok: false, error: "generic" } : { ok: true };
}

export async function saveTheme(theme: string) {
  const parsed = themeSchema.safeParse(theme);
  if (parsed.success) await saveProfilePreference({ theme: parsed.data });
}

type Result = { ok: boolean };

/** Name, age and mobile: editable by the student at any time. */
export async function updateProfileDetails(input: unknown): Promise<Result> {
  const parsed = detailsFormSchema.safeParse(input);
  const profile = await getCurrentProfile();
  if (!parsed.success || !profile || profile.role !== "student") return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      age: parsed.data.age,
      mobile: parsed.data.mobile,
    })
    .eq("id", profile.id);

  revalidatePath("/profile");
  return { ok: !error };
}

/**
 * Pending students may fix their board, class and stream directly. Approved students send a
 * request that a teacher must approve (the database refuses a direct change). The one
 * exception is setting a board for the first time, which anyone with no board yet may do.
 */
export async function changeClass(
  input: unknown,
): Promise<Result & { mode?: "updated" | "requested"; error?: "same" | "duplicate" }> {
  const parsed = classChangeSchema.safeParse(input);
  const profile = await getCurrentProfile();
  if (!parsed.success || !profile || profile.role !== "student") return { ok: false };

  const { board, class: newClass, stream } = parsed.data;
  if (board === profile.board && newClass === profile.class && stream === profile.stream) {
    return { ok: false, error: "same" };
  }

  const supabase = await createClient();
  const onlyAddsBoard =
    profile.board === null && newClass === profile.class && stream === profile.stream;

  if (profile.status === "pending" || (profile.status === "approved" && onlyAddsBoard)) {
    const { error } = await supabase
      .from("profiles")
      .update({ board, class: newClass, stream })
      .eq("id", profile.id);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/tests", "layout");
    return error ? { ok: false } : { ok: true, mode: "updated" };
  }

  if (profile.status !== "approved") return { ok: false };

  const { error } = await supabase.from("class_change_requests").insert({
    student_id: profile.id,
    from_class: profile.class,
    to_board: board,
    to_class: newClass,
    to_stream: stream,
  });
  revalidatePath("/profile");
  // 23505 = the one-open-request-per-student rule.
  if (error?.code === "23505") return { ok: false, error: "duplicate" };
  return error ? { ok: false } : { ok: true, mode: "requested" };
}

export async function withdrawClassRequest(requestId: string): Promise<Result> {
  const profile = await getCurrentProfile();
  if (!profile || !z.uuid().safeParse(requestId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_change_requests")
    .delete()
    .eq("id", requestId)
    .eq("student_id", profile.id)
    .eq("status", "pending");

  revalidatePath("/profile");
  return { ok: !error };
}
