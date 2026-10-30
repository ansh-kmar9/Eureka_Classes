import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireApprovedStudent } from "@/features/auth/guards";
import { OfflineRun } from "@/features/offline/components/offline-run";

export const metadata: Metadata = { title: "Offline test", robots: { index: false } };

export default async function OfflineRunPage() {
  const profile = await requireApprovedStudent();
  return (
    // The test is chosen by ?id= in the address and read on the phone, so one saved page serves every test.
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <OfflineRun userId={profile.id} />
    </Suspense>
  );
}
