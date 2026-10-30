import { requireStudent } from "@/features/auth/guards";
import { LockedScreen } from "@/features/enrolment/components/locked-screen";

/** Everything inside stays locked until a teacher approves the student. */
export default async function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  if (profile.status !== "approved") return <LockedScreen />;
  return children;
}
