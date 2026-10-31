import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/** True when a valid session exists. Cheap: verifies the JWT locally. */
export const isSignedIn = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
});

/**
 * The signed-in user's profile, or null.
 * The session token's signature is checked here without a network call (getUser() would add a full
 * round trip to Supabase to every page). Data access is still enforced by row-level security, which
 * checks the same token, so nothing is readable that the signed-in user could not already read.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
});
