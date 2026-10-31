import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DB_TIMEOUT_MS = 8000;

const headers = { "Cache-Control": "no-store, max-age=0" };

/** Does one tiny read, which keeps the app warm and counts as activity for Supabase's free-plan pause rule. */
async function checkDatabase() {
  const started = Date.now();
  try {
    const query = createAdminClient().from("profiles").select("id").limit(1);
    const result = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    return { ok: !result.error, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

/**
 * Public health check for uptime monitors and cron pings. Returns 200 when the app and its
 * database both answer, 503 otherwise. It reveals nothing about the data, only whether it works.
 */
export async function GET() {
  const db = await checkDatabase();
  return NextResponse.json(
    {
      status: db.ok ? "ok" : "degraded",
      app: "ok",
      database: db.ok ? "ok" : "down",
      databaseMs: db.ms,
      time: new Date().toISOString(),
    },
    { status: db.ok ? 200 : 503, headers },
  );
}

/** Some monitors send HEAD instead of GET: same status code, no body. */
export async function HEAD() {
  const db = await checkDatabase();
  return new Response(null, { status: db.ok ? 200 : 503, headers });
}
