"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import type { ValidationKey } from "@/features/profile/schemas";
import { submitContact } from "../actions";
import { contactSchema, type ContactInput } from "../schemas";

export function ContactForm() {
  const t = useTranslations("contactForm");
  const v = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState<"generic" | "tooMany" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "", website: "" },
  });

  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit((values) => {
    setFailed(null);
    startTransition(async () => {
      const result = await submitContact(values);
      if (result.ok) {
        setSent(true);
        reset();
      } else {
        setFailed(result.error === "tooMany" ? "tooMany" : "generic");
      }
    });
  });

  if (sent) {
    return (
      <Card className="flex items-start gap-3 bg-success-soft">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <p role="status" className="text-sm font-medium">
          {t("success")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <FieldError>{message(errors.name.message)}</FieldError>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-email">{t("email")}</Label>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && <FieldError>{message(errors.email.message)}</FieldError>}
          </div>
          <div>
            <Label htmlFor="contact-phone">{t("phone")}</Label>
            <Input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && <FieldError>{message(errors.phone.message)}</FieldError>}
          </div>
        </div>

        <div>
          <Label htmlFor="contact-message">{t("message")}</Label>
          <Textarea
            id="contact-message"
            aria-invalid={Boolean(errors.message)}
            {...register("message")}
          />
          {errors.message && <FieldError>{message(errors.message.message)}</FieldError>}
        </div>

        {/* Honeypot, hidden from people and assistive tech. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
          </label>
        </div>

        {failed && <FieldError>{errorsT(failed)}</FieldError>}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {pending ? t("sending") : t("send")}
        </Button>
      </form>
    </Card>
  );
}
