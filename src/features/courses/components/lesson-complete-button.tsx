"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { setLessonComplete } from "../actions";

export function LessonCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const t = useTranslations("courses");
  const toasts = useTranslations("toasts");

  return (
    <ActionButton
      variant={completed ? "secondary" : "primary"}
      size="lg"
      className="w-full sm:w-auto"
      successMessage={completed ? undefined : toasts("lessonDone")}
      action={() => setLessonComplete(lessonId, !completed)}
    >
      {completed ? (
        <CheckCircle2 className="size-5 text-success" aria-hidden />
      ) : (
        <Circle className="size-5" aria-hidden />
      )}
      {completed ? t("markUndone") : t("markDone")}
    </ActionButton>
  );
}
