import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Escapes LIKE wildcards so a subject name is matched literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

/**
 * Finds a subject by name (case-insensitive) or creates it.
 * Teachers type subjects freely, so "maths" and "Maths" must resolve to the same one.
 */
export async function resolveSubjectId(
  supabase: SupabaseClient<Database>,
  name: string,
): Promise<string | null> {
  const clean = name.trim().replace(/\s+/g, " ");

  const find = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id")
      .ilike("name", escapeLike(clean))
      .limit(1);
    return data?.[0]?.id ?? null;
  };

  const existing = await find();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("subjects")
    .insert({ name: clean })
    .select("id")
    .single();
  if (data) return data.id;

  // Lost a race with another teacher creating the same subject.
  return error ? find() : null;
}
