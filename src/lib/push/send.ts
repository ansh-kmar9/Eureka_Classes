import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushLocale, PushPayload } from "./messages";

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL ?? "admin@eurekaclasses.live"}`,
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

type Payload = PushPayload | ((locale: PushLocale) => PushPayload);

/**
 * Sends a push notification to every device of the given users.
 * Never throws: a failed notification must not fail the action that triggered it.
 * Pass a function to send each person the message in their own language.
 */
export async function sendPushToUsers(userIds: string[], payload: Payload) {
  if (userIds.length === 0 || !configure()) return;

  try {
    const supabase = createAdminClient();
    const [{ data: subs }, { data: profiles }] = await Promise.all([
      supabase.from("push_subscriptions").select("*").in("user_id", userIds),
      supabase.from("profiles").select("id, language").in("id", userIds),
    ]);
    if (!subs?.length) return;

    const languageOf = new Map(profiles?.map((p) => [p.id, p.language]));
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        const locale: PushLocale = languageOf.get(sub.user_id) === "hi" ? "hi" : "en";
        const body = JSON.stringify(
          typeof payload === "function" ? payload(locale) : payload,
        );
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
            { TTL: 60 * 60 * 24 },
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          // 404/410 mean the device unsubscribed or the app was removed.
          if (status === 404 || status === 410) expired.push(sub.endpoint);
        }
      }),
    );

    if (expired.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }
  } catch {
    // Intentionally swallowed, see above.
  }
}

/** All approved students, optionally limited to one class (and stream). */
export async function sendPushToStudents(
  payload: Payload,
  scope: { class?: number; stream?: string | null } = {},
) {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("status", "approved");
    if (scope.class) query = query.eq("class", scope.class);
    if (scope.stream) query = query.eq("stream", scope.stream as never);

    const { data } = await query;
    await sendPushToUsers(data?.map((row) => row.id) ?? [], payload);
  } catch {
    // See sendPushToUsers.
  }
}
