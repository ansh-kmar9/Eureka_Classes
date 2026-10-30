import type { Profile } from "@/lib/supabase/types";

/** Only same-site paths are allowed as a post-login destination (prevents open redirects). */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return fallback;
}

export function homePathFor(profile: Pick<Profile, "role" | "status">): string {
  if (profile.role === "admin") return "/admin";
  if (profile.role === "teacher") return "/teacher";
  return profile.status === "incomplete" ? "/onboarding" : "/dashboard";
}
