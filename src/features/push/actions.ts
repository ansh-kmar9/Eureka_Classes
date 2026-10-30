"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(200),
  }),
});

/** Links this device to the signed-in user so they can receive notifications. */
export async function savePushSubscription(
  input: unknown,
  userAgent?: string,
): Promise<{ ok: boolean }> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const session = await createClient();
  const { data } = await session.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false };

  const { endpoint, keys } = parsed.data;

  // The service role is used because a shared phone may already hold this endpoint under
  // another account; the user id still comes from the verified session above.
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent?.slice(0, 300) ?? null,
      },
      { onConflict: "endpoint" },
    );

  return { ok: !error };
}
