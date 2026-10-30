"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { updateProfileDetails } from "../actions";
import {
  detailsFormSchema,
  type DetailsFormInput,
  type DetailsFormValues,
  type ValidationKey,
} from "../schemas";

export function DetailsForm({ defaults }: { defaults: DetailsFormInput }) {
  const t = useTranslations("profile");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const v = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<DetailsFormInput, unknown, DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: defaults,
  });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    setStatus("idle");
    const raw = getValues();
    startTransition(async () => {
      const result = await updateProfileDetails(raw);
      if (result.ok) {
        reset(raw);
        setStatus("saved");
        toast.success(toasts("saved"));
      } else {
        setStatus("failed");
      }
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("detailsTitle")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="profile-name">{t("fullName")}</Label>
          <Input
            id="profile-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName && <FieldError>{message(errors.fullName.message)}</FieldError>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="profile-age">{t("age")}</Label>
            <Input
              id="profile-age"
              inputMode="numeric"
              maxLength={2}
              aria-invalid={Boolean(errors.age)}
              {...register("age")}
            />
            {errors.age && <FieldError>{message(errors.age.message)}</FieldError>}
          </div>
          <div>
            <Label htmlFor="profile-mobile">{t("mobile")}</Label>
            <Input
              id="profile-mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              aria-invalid={Boolean(errors.mobile)}
              {...register("mobile")}
            />
            {errors.mobile && <FieldError>{message(errors.mobile.message)}</FieldError>}
          </div>
        </div>
        {status === "failed" && <FieldError>{errorsT("generic")}</FieldError>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
          {status === "saved" && (
            <span role="status" className="text-sm text-success">
              {t("saved")}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
