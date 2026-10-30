"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createTest } from "@/features/tests/actions";

/** Creates the practice test for a topic, then opens it so questions can be added. */
export function CreateTestButton({ topicId }: { topicId: string }) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            const result = await createTest(topicId);
            if (result.ok && result.id) router.push(`/teacher/tests/${result.id}`);
            else setFailed(true);
          })
        }
      >
        {pending ? t("creating") : t("createTest")}
      </Button>
      {failed && (
        <span role="alert" className="ml-2 text-sm text-danger">
          {t("failed")}
        </span>
      )}
    </>
  );
}
