"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  AudienceFields,
  SubjectField,
} from "@/features/content/components/audience-fields";
import {
  courseFormSchema,
  type CourseFormInput,
  type CourseFormValues,
} from "@/features/content/schemas";
import type { ValidationKey } from "@/features/profile/schemas";
import { createCourse } from "../actions";

export function CourseForm({ subjects }: { subjects: string[] }) {
  const t = useTranslations("content");
  const v = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { class: undefined, stream: "", subject: "", title: "", description: "" },
  });
  const selectedClass = useWatch({ control, name: "class" });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    setFailed(false);
    // The server validates the raw form values again with the same schema.
    const raw = getValues();
    startTransition(async () => {
      const result = await createCourse(raw);
      if (result.ok && result.id) router.push(`/teacher/content/courses/${result.id}`);
      else setFailed(true);
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("courses.new")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <AudienceFields
          idPrefix="course"
          classProps={register("class")}
          streamProps={register("stream")}
          selectedClass={selectedClass}
          errors={{ class: message(errors.class?.message) }}
        />
        <SubjectField
          idPrefix="course"
          props={register("subject")}
          subjects={subjects}
          error={message(errors.subject?.message)}
        />
        <div>
          <Label htmlFor="course-title">{t("title")}</Label>
          <Input
            id="course-title"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && <FieldError>{message(errors.title.message)}</FieldError>}
        </div>
        <div>
          <Label htmlFor="course-description">{t("description")}</Label>
          <Textarea
            id="course-description"
            maxLength={500}
            className="min-h-20"
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          {errors.description && <FieldError>{message(errors.description.message)}</FieldError>}
        </div>
        {failed && <FieldError>{errorsT("generic")}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? t("courses.creating") : t("courses.create")}
        </Button>
      </form>
    </Card>
  );
}
