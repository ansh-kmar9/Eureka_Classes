import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireApprovedStudent } from "@/features/auth/guards";
import { TestRunner } from "@/features/tests/components/test-runner";
import { getQuestions, getTestDetail } from "@/features/tests/queries";

export const metadata: Metadata = { title: "Test", robots: { index: false } };

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireApprovedStudent();
  const { id } = await params;
  const found = await getTestDetail(id);
  if (!found) notFound();

  const questions = await getQuestions(id);
  if (questions.length === 0) redirect(`/tests/${id}`);

  return (
    <TestRunner
      testId={id}
      topic={found.topic.name}
      durationMinutes={found.test.duration_minutes}
      // The answer key stays on the server while a test is being taken.
      questions={questions.map(({ id: questionId, text, options }) => ({
        id: questionId,
        text,
        options,
      }))}
    />
  );
}
