"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "./schemas";

export type ContactResult = { ok: true } | { ok: false; error?: "tooMany" };

export async function submitContact(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    // A filled honeypot is treated as success so bots learn nothing.
    const honeypotTripped =
      typeof input === "object" &&
      input !== null &&
      "website" in input &&
      Boolean((input as { website?: unknown }).website);
    return honeypotTripped ? { ok: true } : { ok: false };
  }

  const { name, email, phone, message } = parsed.data;

  // At most 3 messages per address every 10 minutes. The public table cannot be read by visitors,
  // so the count is done with the server's own access.
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await createAdminClient()
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { ok: false, error: "tooMany" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, phone: phone || null, message });

  return error ? { ok: false } : { ok: true };
}
