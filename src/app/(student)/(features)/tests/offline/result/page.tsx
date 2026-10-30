import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireApprovedStudent } from "@/features/auth/guards";
import { OfflineResult } from "@/features/offline/components/offline-result";

export const metadata: Metadata = { title: "Offline result", robots: { index: false } };

export default async function OfflineResultPage() {
  const profile = await requireApprovedStudent();
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <OfflineResult userId={profile.id} />
    </Suspense>
  );
}
