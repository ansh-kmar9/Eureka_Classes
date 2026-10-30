"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/features/auth/guards";
import { materialFormSchema } from "@/features/content/schemas";
import { resolveSubjectId } from "@/features/content/subjects";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean };

function refresh() {
  revalidatePath("/teacher/content/materials");
  revalidatePath("/study-material");
}

export async function createMaterial(input: unknown): Promise<Result> {
  const parsed = materialFormSchema.safeParse(input);
  if (!parsed.success || !(await getStaff())) return { ok: false };

  const supabase = await createClient();
  const { subject, ...material } = parsed.data;
  const subjectId = await resolveSubjectId(supabase, subject);
  if (!subjectId) return { ok: false };

  const { error } = await supabase
    .from("study_materials")
    .insert({ ...material, subject_id: subjectId });

  refresh();
  return { ok: !error };
}

export async function deleteMaterial(id: string): Promise<Result> {
  if (!(await getStaff()) || !z.uuid().safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("study_materials").delete().eq("id", id);

  refresh();
  return { ok: !error };
}
