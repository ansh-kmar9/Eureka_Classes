"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { needsStream } from "@/features/profile/schemas";
import { createClient } from "@/lib/supabase/server";
import { catalogScopeSchema, subjectNameSchema, topicNameSchema } from "./schemas";

type Result = { ok: boolean; error?: "duplicate" };
const idSchema = z.uuid();

function refresh() {
  revalidatePath("/teacher/tests");
  revalidatePath("/tests", "layout");
}

/** Adds a subject to the board, class and stream the teacher is managing. */
export async function addSubject(scope: unknown, input: unknown): Promise<Result> {
  const parsedScope = catalogScopeSchema.safeParse(scope);
  const parsedName = subjectNameSchema.safeParse(input);
  if (!parsedScope.success || !parsedName.success || !(await getStaff())) return { ok: false };

  const { board, class: klass, stream } = parsedScope.data;
  const supabase = await createClient();
  const { error } = await supabase.from("catalog_subjects").insert({
    board,
    class: Number(klass),
    // Below class 11 there are no streams; at 11 and 12 an empty stream means every stream.
    stream: needsStream(klass) && stream ? stream : null,
    name: parsedName.data.name,
  });

  refresh();
  if (error?.code === "23505") return { ok: false, error: "duplicate" };
  return { ok: !error };
}

export async function setSubjectActive(subjectId: string, active: boolean): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(subjectId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_subjects")
    .update({ is_active: active })
    .eq("id", subjectId);

  refresh();
  return { ok: !error };
}

export async function addTopic(subjectId: string, input: unknown): Promise<Result> {
  const parsed = topicNameSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(subjectId).success || !(await getStaff())) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("catalog_topics")
    .select("position")
    .eq("subject_id", subjectId)
    .order("position", { ascending: false })
    .limit(1);

  const { error } = await supabase.from("catalog_topics").insert({
    subject_id: subjectId,
    name: parsed.data.name,
    position: (last?.[0]?.position ?? 0) + 1,
  });

  refresh();
  if (error?.code === "23505") return { ok: false, error: "duplicate" };
  return { ok: !error };
}

export async function setTopicActive(topicId: string, active: boolean): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(topicId).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_topics")
    .update({ is_active: active })
    .eq("id", topicId);

  refresh();
  return { ok: !error };
}

/** Removes a topic, but never one that already has a test: that would delete its questions too. */
export async function deleteTopic(topicId: string): Promise<Result> {
  if (!(await getStaff()) || !idSchema.safeParse(topicId).success) return { ok: false };

  const supabase = await createClient();
  const { data: test } = await supabase
    .from("practice_tests")
    .select("id")
    .eq("topic_id", topicId)
    .maybeSingle();
  if (test) return { ok: false };

  const { error } = await supabase.from("catalog_topics").delete().eq("id", topicId);

  refresh();
  return { ok: !error };
}
