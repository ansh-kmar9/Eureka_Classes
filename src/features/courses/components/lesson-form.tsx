"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { lessonFormSchema, type LessonFormInput } from "@/features/content/schemas";
import type { ValidationKey } from "@/features/profile/schemas";
import { addLesson } from "../actions";

export function LessonForm({ courseId }: { courseId: string }) {
  const t = useTranslations("content.lessons");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const v = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<LessonFormInput>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: { title: "", type: "video", url: "" },
  });
  const type = useWatch({ control, name: "type" });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit((values) => {
    setFailed(false);
    startTransition(async () => {
      const result = await addLesson(courseId, values);
      if (result.ok) {
        reset({ title: "", type: values.type, url: "" });
        toast.success(toasts("added"));
      } else {
        setFailed(true);
      }
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("add")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <Label htmlFor="lesson-title">{t("titleLabel")}</Label>
            <Input
              id="lesson-title"
              maxLength={120}
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            {errors.title && <FieldError>{message(errors.title.message)}</FieldError>}
          </div>
          <div>
            <Label htmlFor="lesson-type">{t("type")}</Label>
            <Select id="lesson-type" {...register("type")}>
              <option value="video">{t("video")}</option>
              <option value="pdf">{t("pdf")}</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="lesson-url">{type === "video" ? t("videoUrl") : t("pdfUrl")}</Label>
          <Input
            id="lesson-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            aria-invalid={Boolean(errors.url)}
            {...register("url")}
          />
          {errors.url && <FieldError>{message(errors.url.message)}</FieldError>}
        </div>
        {failed && <FieldError>{errorsT("generic")}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? t("adding") : t("add")}
        </Button>
      </form>
    </Card>
  );
}
