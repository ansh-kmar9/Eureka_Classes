"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  AudienceFields,
  SubjectField,
} from "@/features/content/components/audience-fields";
import {
  materialFormSchema,
  type MaterialFormInput,
  type MaterialFormValues,
} from "@/features/content/schemas";
import type { ValidationKey } from "@/features/profile/schemas";
import { createMaterial } from "../actions";

export function MaterialForm({ subjects }: { subjects: string[] }) {
  const t = useTranslations("content");
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
    getValues,
    formState: { errors },
  } = useForm<MaterialFormInput, unknown, MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: { class: undefined, stream: "", subject: "", title: "", url: "" },
  });
  const selectedClass = useWatch({ control, name: "class" });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    setFailed(false);
    const raw = getValues();
    startTransition(async () => {
      const result = await createMaterial(raw);
      if (result.ok) {
        // Keep class and subject: teachers usually add several items in a row.
        reset({ ...raw, title: "", url: "" });
        toast.success(toasts("added"));
      } else {
        setFailed(true);
      }
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("materials.new")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <AudienceFields
          idPrefix="material"
          classProps={register("class")}
          streamProps={register("stream")}
          selectedClass={selectedClass}
          errors={{ class: message(errors.class?.message) }}
        />
        <SubjectField
          idPrefix="material"
          props={register("subject")}
          subjects={subjects}
          error={message(errors.subject?.message)}
        />
        <div>
          <Label htmlFor="material-title">{t("title")}</Label>
          <Input
            id="material-title"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && <FieldError>{message(errors.title.message)}</FieldError>}
        </div>
        <div>
          <Label htmlFor="material-url">{t("url")}</Label>
          <Input
            id="material-url"
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
          {pending ? t("materials.adding") : t("materials.add")}
        </Button>
      </form>
    </Card>
  );
}
