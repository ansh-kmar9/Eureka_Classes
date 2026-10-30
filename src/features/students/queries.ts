import "server-only";
import { sanitizeSearch } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import type { Profile, StreamType, StudentStatus } from "@/lib/supabase/types";

export const PAGE_SIZE = 20;

export const STATUS_FILTERS = ["pending", "approved", "blocked", "incomplete"] as const;
const STREAMS: readonly string[] = ["science", "commerce", "arts"];

export interface StudentFilters {
  q: string;
  class: number | null;
  stream: StreamType | null;
  status: StudentStatus | null;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Turns raw URL parameters into safe, validated filters. */
export function parseStudentFilters(params: SearchParams): StudentFilters {
  const classNumber = Number(first(params.class));
  const stream = first(params.stream);
  const status = first(params.status);
  const page = Math.floor(Number(first(params.page)));

  return {
    q: sanitizeSearch(first(params.q)),
    class: Number.isInteger(classNumber) && classNumber >= 6 && classNumber <= 12 ? classNumber : null,
    stream: stream && STREAMS.includes(stream) ? (stream as StreamType) : null,
    status: (STATUS_FILTERS as readonly string[]).includes(status ?? "")
      ? (status as StudentStatus)
      : null,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export async function listStudents(filters: StudentFilters) {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Students who have not finished their profile only appear when asked for.
  query = filters.status ? query.eq("status", filters.status) : query.neq("status", "incomplete");
  if (filters.class) query = query.eq("class", filters.class);
  if (filters.stream) query = query.eq("stream", filters.stream);
  if (filters.q) {
    query = query.or(
      `full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,mobile.ilike.%${filters.q}%`,
    );
  }

  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getStatusCounts(): Promise<Record<StudentStatus, number>> {
  const supabase = await createClient();
  const statuses: StudentStatus[] = ["pending", "approved", "blocked", "incomplete"];

  const results = await Promise.all(
    statuses.map((status) =>
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student")
        .eq("status", status),
    ),
  );

  return Object.fromEntries(
    statuses.map((status, index) => [status, results[index].count ?? 0]),
  ) as Record<StudentStatus, number>;
}

export async function getStudent(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle();
  return data;
}
