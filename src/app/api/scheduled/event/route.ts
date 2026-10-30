import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { recordStrike } from "@/features/scheduled/attempts";
import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  attemptId: z.uuid(),
  type: z.enum(["hidden", "fullscreen_exit", "navigation"]),
});

/**
 * Receives integrity events from a running scheduled test. The browser sends these with
 * `navigator.sendBeacon`, which still gets through when the app is being closed or hidden,
 * so leaving the test is counted even if the page never gets another chance to talk.
 */
export async function POST(request: NextRequest) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { attemptId } = parsed.data;

  // Only the student who owns the attempt can report on it.
  const { data: attempt } = await createAdminClient()
    .from("scheduled_attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("student_id", profile.id)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Leaving the app, leaving fullscreen and pressing Back are all one warning each.
  const result = await recordStrike(attemptId);

  return NextResponse.json({ status: result?.status ?? "unknown", strikes: result?.strikes ?? 0 });
}
