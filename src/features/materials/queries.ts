import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StudyMaterial } from "@/lib/supabase/types";

export interface MaterialWithSubject extends StudyMaterial {
  subject: string;
}

/** Material the caller may see (students get only their own class and stream). */
export async function listMaterials(classFilter?: number | null): Promise<MaterialWithSubject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("study_materials")
    .select("*")
    .order("created_at", { ascending: false });
  if (classFilter) query = query.eq("class", classFilter);
  const { data: materials } = await query;
  if (!materials?.length) return [];

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .in("id", [...new Set(materials.map((m) => m.subject_id))]);
  const name = new Map(subjects?.map((s) => [s.id, s.name]));

  return materials.map((m) => ({ ...m, subject: name.get(m.subject_id) ?? "" }));
}

/** Groups items by subject name, subjects sorted alphabetically. */
export function groupBySubject<T extends { subject: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.subject, [...(groups.get(item.subject) ?? []), item]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
