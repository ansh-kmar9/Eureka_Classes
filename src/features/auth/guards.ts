import "server-only";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";
import { getCurrentProfile } from "./queries";
import { homePathFor } from "./utils";

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** A student with a finished profile. Staff are sent to their own area. */
export async function requireStudent(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "student") redirect(homePathFor(profile));
  if (profile.status === "incomplete") redirect("/onboarding");
  return profile;
}

/** A student whose enrolment a teacher has approved. */
export async function requireApprovedStudent(): Promise<Profile> {
  const profile = await requireStudent();
  if (profile.status !== "approved") redirect("/dashboard");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role === "student") redirect(homePathFor(profile));
  return profile;
}

/**
 * Admin access needs the database role AND the configured admin email.
 * The role alone is not trusted.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (
    profile.role !== "admin" ||
    !adminEmail ||
    profile.email.toLowerCase() !== adminEmail
  ) {
    redirect(homePathFor(profile));
  }
  return profile;
}

/** For Server Actions: returns the caller if they are staff, otherwise null (never redirects). */
export async function getStaff(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  return profile && profile.role !== "student" ? profile : null;
}

/** For Server Actions: the caller if they are the configured admin, otherwise null. */
export async function getAdmin(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return profile &&
    adminEmail &&
    profile.role === "admin" &&
    profile.email.toLowerCase() === adminEmail
    ? profile
    : null;
}
