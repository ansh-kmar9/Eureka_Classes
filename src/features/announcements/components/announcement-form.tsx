"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ValidationKey } from "@/features/profile/schemas";
import { createAnnouncement } from "../actions";
import { announcementSchema, type AnnouncementInput } from "../schemas";

export function AnnouncementForm() {
  const t = useTranslations("announcements");
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
    formState: { errors },
  } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", body: "" },
  });

  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit((values) => {
    setFailed(false);
    startTransition(async () => {
      const result = await createAnnouncement(values);
      if (result.ok) {
        reset();
        toast.success(toasts("announcement"));
      } else {
        setFailed(true);
      }
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("newTitle")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="announcement-title">{t("titleLabel")}</Label>
          <Input
            id="announcement-title"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && <FieldError>{message(errors.title.message)}</FieldError>}
        </div>
        <div>
          <Label htmlFor="announcement-body">{t("bodyLabel")}</Label>
          <Textarea
            id="announcement-body"
            maxLength={2000}
            aria-invalid={Boolean(errors.body)}
            {...register("body")}
          />
          {errors.body && <FieldError>{message(errors.body.message)}</FieldError>}
        </div>
        {failed && <FieldError>{errorsT("generic")}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? t("publishing") : t("publish")}
        </Button>
      </form>
    </Card>
  );
}
