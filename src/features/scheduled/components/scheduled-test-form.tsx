"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { AudienceFields } from "@/features/content/components/audience-fields";
import type { ValidationKey } from "@/features/profile/schemas";
import { createScheduledTest } from "../actions";
import {
  scheduledTestFormSchema,
  type ScheduledTestFormInput,
  type ScheduledTestFormValues,
} from "../schemas";

export function ScheduledTestForm() {
  const t = useTranslations("scheduledAdmin");
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
  } = useForm<ScheduledTestFormInput, unknown, ScheduledTestFormValues>({
    resolver: zodResolver(scheduledTestFormSchema),
    defaultValues: { title: "", class: undefined, stream: "", startsAt: "", duration: "60" },
  });
  const selectedClass = useWatch({ control, name: "class" });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    setFailed(false);
    const raw = getValues();
    startTransition(async () => {
      const result = await createScheduledTest(raw);
      if (result.ok && result.id) router.push(`/teacher/tests/scheduled/${result.id}`);
      else setFailed(true);
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-semibold">{t("new")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("newHint")}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="st-title">{t("titleLabel")}</Label>
          <Input
            id="st-title"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && <FieldError>{message(errors.title.message)}</FieldError>}
        </div>

        <AudienceFields
          idPrefix="st"
          classProps={register("class")}
          streamProps={register("stream")}
          selectedClass={selectedClass}
          errors={{ class: message(errors.class?.message) }}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <div>
            <Label htmlFor="st-start">{t("startsAt")}</Label>
            <Input
              id="st-start"
              type="datetime-local"
              aria-invalid={Boolean(errors.startsAt)}
              {...register("startsAt")}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{t("timeHint")}</p>
            {errors.startsAt && <FieldError>{message(errors.startsAt.message)}</FieldError>}
          </div>
          <div>
            <Label htmlFor="st-duration">{t("duration")}</Label>
            <Input
              id="st-duration"
              inputMode="numeric"
              maxLength={3}
              aria-invalid={Boolean(errors.duration)}
              {...register("duration")}
            />
            {errors.duration && <FieldError>{message(errors.duration.message)}</FieldError>}
          </div>
        </div>

        {failed && <FieldError>{errorsT("generic")}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? t("creating") : t("create")}
        </Button>
      </form>
    </Card>
  );
}
