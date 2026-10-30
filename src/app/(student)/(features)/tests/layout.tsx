import { TestsTabs } from "@/features/tests/components/tests-tabs";

export default function StudentTestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <TestsTabs base="/tests" />
      {children}
    </div>
  );
}
