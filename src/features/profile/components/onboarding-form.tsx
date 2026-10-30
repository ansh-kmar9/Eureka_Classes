"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { completeProfile } from "../actions";
import {
  BOARD_VALUES,
  CLASS_VALUES,
  needsStream,
  profileFormSchema,
  STREAM_VALUES,
  type ProfileFormInput,
  type ProfileFormValues,
  type ValidationKey,
} from "../schemas";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("onboarding");
  const streams = useTranslations("streams");
  const boards = useTranslations("boards");
  const v = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const router = useRouter();
  const { theme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: defaultName,
      board: undefined,
      class: undefined,
      stream: "",
      age: "",
      mobile: "",
    },
  });

  const selectedClass = useWatch({ control, name: "class" });
  const showStream = selectedClass ? needsStream(selectedClass) : false;

  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const onSubmit = handleSubmit(() => {
    // Send the raw (string) values: the server validates them again with the same schema.
    const raw = { ...getValues(), stream: getValues("stream") ?? "" };
    setFormError(null);
    startTransition(async () => {
      const result = await completeProfile(raw, theme);
      if (result.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setFormError(errorsT(result.error));
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        {errors.fullName && <FieldError>{message(errors.fullName.message)}</FieldError>}
      </div>

      <div>
        <Label htmlFor="board">{t("board")}</Label>
        <Select
          id="board"
          defaultValue=""
          aria-invalid={Boolean(errors.board)}
          {...register("board")}
        >
          <option value="" disabled>
            {t("boardPlaceholder")}
          </option>
          {BOARD_VALUES.map((value) => (
            <option key={value} value={value}>
              {boards(value)}
            </option>
          ))}
        </Select>
        {errors.board && <FieldError>{message(errors.board.message)}</FieldError>}
      </div>

      <div>
        <Label htmlFor="class">{t("class")}</Label>
        <Select
          id="class"
          defaultValue=""
          aria-invalid={Boolean(errors.class)}
          {...register("class")}
        >
          <option value="" disabled>
            {t("classPlaceholder")}
          </option>
          {CLASS_VALUES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        {errors.class && <FieldError>{message(errors.class.message)}</FieldError>}
      </div>

      {showStream && (
        <div>
          <Label htmlFor="stream">{t("stream")}</Label>
          <Select
            id="stream"
            defaultValue=""
            aria-invalid={Boolean(errors.stream)}
            {...register("stream")}
          >
            <option value="" disabled>
              {t("streamPlaceholder")}
            </option>
            {STREAM_VALUES.map((value) => (
              <option key={value} value={value}>
                {streams(value)}
              </option>
            ))}
          </Select>
          {errors.stream && <FieldError>{message(errors.stream.message)}</FieldError>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="age">{t("age")}</Label>
          <Input
            id="age"
            type="text"
            inputMode="numeric"
            maxLength={2}
            aria-invalid={Boolean(errors.age)}
            {...register("age")}
          />
          {errors.age && <FieldError>{message(errors.age.message)}</FieldError>}
        </div>
        <div>
          <Label htmlFor="mobile">{t("mobile")}</Label>
          <Input
            id="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder={t("mobileHint")}
            aria-invalid={Boolean(errors.mobile)}
            {...register("mobile")}
          />
          {errors.mobile && <FieldError>{message(errors.mobile.message)}</FieldError>}
        </div>
      </div>

      {formError && <FieldError>{formError}</FieldError>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
