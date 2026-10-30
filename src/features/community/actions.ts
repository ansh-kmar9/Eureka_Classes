"use server";

import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { CommunityRow, Profile } from "@/lib/supabase/types";
import { POST_MAX_LENGTH } from "./limits";

const idSchema = z.uuid();

const postSchema = z.object({
  body: z.string().trim().min(1).max(POST_MAX_LENGTH),
  parentId: z.uuid().optional(),
});

/** Approved students and staff may use the community (row-level security enforces it as well). */
const allowed = (profile: Profile | null): profile is Profile =>
  Boolean(profile && (profile.role !== "student" || profile.status === "approved"));

export async function loadFeed(before?: string): Promise<CommunityRow[]> {
  if (!allowed(await getCurrentProfile())) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("community_feed", {
    p_limit: 30,
    p_before: before ?? null,
  });
  return data ?? [];
}

export async function loadReplies(parentId: string): Promise<CommunityRow[]> {
  if (!idSchema.safeParse(parentId).success || !allowed(await getCurrentProfile())) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("community_replies", { p_parent: parentId });
  return data ?? [];
}

export type PostResult = { ok: true } | { ok: false; error: "invalid" | "tooFast" | "generic" };

export async function postMessage(input: unknown): Promise<PostResult> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const profile = await getCurrentProfile();
  if (!allowed(profile)) return { ok: false, error: "generic" };

  const supabase = await createClient();

  // A simple brake on flooding: at most 8 posts a minute per person.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("community_messages")
    .select("id", { count: "exact", head: true })
    .eq("author_id", profile.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 8) return { ok: false, error: "tooFast" };

  const { error } = await supabase.from("community_messages").insert({
    body: parsed.data.body,
    parent_id: parsed.data.parentId ?? null,
  });
  return error ? { ok: false, error: "generic" } : { ok: true };
}

export type LikeResult = { ok: true; liked: boolean; count: number } | { ok: false };

export async function toggleLike(messageId: string): Promise<LikeResult> {
  const profile = await getCurrentProfile();
  if (!idSchema.safeParse(messageId).success || !allowed(profile)) return { ok: false };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_likes")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", profile.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("community_likes")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", profile.id)
    : await supabase.from("community_likes").insert({ message_id: messageId });
  if (error) return { ok: false };

  const { count } = await supabase
    .from("community_likes")
    .select("message_id", { count: "exact", head: true })
    .eq("message_id", messageId);
  return { ok: true, liked: !existing, count: count ?? 0 };
}

/** Authors delete their own messages; teachers delete anyone's. The database decides which. */
export async function deleteMessage(messageId: string): Promise<{ ok: boolean }> {
  if (!idSchema.safeParse(messageId).success || !allowed(await getCurrentProfile())) {
    return { ok: false };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("community_messages").delete().eq("id", messageId);
  return { ok: !error };
}
