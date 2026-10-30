import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/lib/supabase/types";

/**
 * Remembers the user's language/theme on their profile so it follows them across devices.
 * Does nothing for signed-out visitors, and never throws: a preference is not worth an error page.
 */
export async function saveProfilePreference(
  patch: { language?: "en" | "hi"; theme?: ThemePreference },
) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) return;
    await supabase.from("profiles").update(patch).eq("id", userId);
  } catch {
    // Ignored on purpose.
  }
}
