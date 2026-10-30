import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireApprovedStudent } from "@/features/auth/guards";
import { ScheduledRunner } from "@/features/scheduled/components/scheduled-runner";
import { getMyAttempt, getScheduledTest, phaseOf } from "@/features/scheduled/queries";
import { endsAtMs } from "@/lib/schedule";

export const metadata: Metadata = { title: "Scheduled test", robots: { index: false } };

export default async function TakeScheduledTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireApprovedStudent();
  const { id } = await params;
  const test = await getScheduledTest(id);
  if (!test) notFound();

  const attempt = await getMyAttempt(id, profile.id);

  // Only a test that is open right now, and not yet handed in, can be taken.
  if (phaseOf(test) !== "live" || attempt?.status === "submitted") {
    redirect(`/tests/scheduled/${id}`);
  }

  return (
    <ScheduledRunner
      testId={id}
      title={test.title}
      endsAt={new Date(endsAtMs(test)).toISOString()}
      resuming={Boolean(attempt)}
    />
  );
}
