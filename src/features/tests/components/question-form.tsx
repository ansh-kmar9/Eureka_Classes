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
import {
  questionFormSchema,
  type QuestionFormInput,
  type QuestionFormValues,
} from "../schemas";

const OPTIONS = [
  { field: "option1", letter: "A", value: "0" },
  { field: "option2", letter: "B", value: "1" },
  { field: "option3", letter: "C", value: "2" },
  { field: "option4", letter: "D", value: "3" },
] as const;

export function QuestionForm({
  add,
  disabled,
}: {
  /** Server Action that stores the question, already bound to its test. */
  add: (input: unknown) => Promise<{ ok: boolean }>;
  disabled: boolean;
}) {
  const t = useTranslations("testsAdmin.question");
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
    getValues,
    formState: { errors },
  } = useForm<QuestionFormInput, unknown, QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct: undefined,
      explanation: "",
    },
  });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    setFailed(false);
    const raw = getValues();
    startTransition(async () => {
      const result = await add(raw);
      if (result.ok) {
        reset();
        toast.success(toasts("added"));
      } else {
        setFailed(true);
      }
    });
  });

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold">{t("title")}</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <fieldset disabled={disabled || pending} className="space-y-4">
          <div>
            <Label htmlFor="q-text">{t("text")}</Label>
            <Textarea
              id="q-text"
              maxLength={1000}
              className="min-h-20"
              aria-invalid={Boolean(errors.text)}
              {...register("text")}
            />
            {errors.text && <FieldError>{message(errors.text.message)}</FieldError>}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("optionsHint")}</p>
            {OPTIONS.map(({ field, letter, value }) => (
              <div key={field} className="flex items-start gap-3">
                <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border has-checked:border-primary has-checked:bg-primary-soft">
                  <input
                    type="radio"
                    value={value}
                    className="sr-only"
                    aria-label={t("markCorrect", { letter })}
                    {...register("correct")}
                  />
                  <span className="text-sm font-bold">{letter}</span>
                </label>
                <div className="flex-1">
                  <Input
                    maxLength={300}
                    aria-label={t("option", { letter })}
                    aria-invalid={Boolean(errors[field])}
                    {...register(field)}
                  />
                  {errors[field] && <FieldError>{message(errors[field]?.message)}</FieldError>}
                </div>
              </div>
            ))}
            {errors.correct && <FieldError>{message(errors.correct.message)}</FieldError>}
          </div>

          <div>
            <Label htmlFor="q-explanation">{t("explanation")}</Label>
            <Textarea
              id="q-explanation"
              maxLength={1000}
              className="min-h-16"
              {...register("explanation")}
            />
          </div>

          {failed && <FieldError>{errorsT("generic")}</FieldError>}
          <Button type="submit">{pending ? t("adding") : t("add")}</Button>
        </fieldset>
        {disabled && <p className="text-sm text-muted-foreground">{t("disabledHint")}</p>}
      </form>
    </Card>
  );
}
