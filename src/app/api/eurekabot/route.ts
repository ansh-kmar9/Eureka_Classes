import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getCurrentProfile } from "@/features/auth/queries";
import { buildBotSystem } from "@/features/eurekabot/prompt";
import { GeminiError, generateChat } from "@/lib/gemini/client";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_TURNS = 20;
const MAX_TEXT = 2000;
/** Messages one person may send per hour. The free Gemini quota is shared by every student. */
const HOURLY_LIMIT = 60;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().trim().min(1).max(MAX_TEXT) }))
    .min(1)
    .max(MAX_TURNS),
});

/**
 * EurekaBot. The conversation lives only in the student's browser: this route keeps nothing,
 * so closing the page really does start a fresh chat. The Gemini key never leaves the server.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  const allowed = profile && (profile.role !== "student" || profile.status === "approved");
  if (!profile || !allowed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("kind", "bot")
    .gte("created_at", since);
  if ((count ?? 0) >= HOURLY_LIMIT) return NextResponse.json({ error: "rateLimited" }, { status: 429 });

  await admin.from("ai_usage").insert({ user_id: profile.id, kind: "bot" });

  try {
    const reply = await generateChat({
      system: buildBotSystem({
        language: (await getLocale()) === "hi" ? "hi" : "en",
        board: profile.board,
        classNumber: profile.class,
        stream: profile.stream,
      }),
      turns: parsed.data.messages,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("EurekaBot failed:", error instanceof Error ? error.message : error);
    if (error instanceof GeminiError) {
      if (error.kind === "not_configured") {
        return NextResponse.json({ error: "unavailable" }, { status: 503 });
      }
      if (error.kind === "busy") return NextResponse.json({ error: "busy" }, { status: 503 });
    }
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
