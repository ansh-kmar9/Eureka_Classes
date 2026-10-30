import { TestsTabs } from "@/features/tests/components/tests-tabs";

export default function TeacherTestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <TestsTabs base="/teacher/tests" />
      {children}
    </div>
  );
}
