"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { CLASS_VALUES, needsStream, STREAM_VALUES } from "@/features/profile/schemas";

/** Class and stream pickers shared by the course and study-material forms. */
export function AudienceFields({
  classProps,
  streamProps,
  selectedClass,
  errors,
  idPrefix,
}: {
  classProps: UseFormRegisterReturn;
  streamProps: UseFormRegisterReturn;
  selectedClass: string | undefined;
  errors: { class?: string; stream?: string };
  idPrefix: string;
}) {
  const t = useTranslations("content");
  const streams = useTranslations("streams");
  const common = useTranslations("common");
  const showStream = selectedClass ? needsStream(selectedClass) : false;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-class`}>{t("class")}</Label>
        <Select
          id={`${idPrefix}-class`}
          defaultValue=""
          aria-invalid={Boolean(errors.class)}
          {...classProps}
        >
          <option value="" disabled>
            {t("classPlaceholder")}
          </option>
          {CLASS_VALUES.map((value) => (
            <option key={value} value={value}>
              {common("classLabel", { n: value })}
            </option>
          ))}
        </Select>
        {errors.class && <FieldError>{errors.class}</FieldError>}
      </div>
      {showStream && (
        <div>
          <Label htmlFor={`${idPrefix}-stream`}>{t("stream")}</Label>
          <Select id={`${idPrefix}-stream`} defaultValue="" {...streamProps}>
            <option value="">{t("allStreams")}</option>
            {STREAM_VALUES.map((value) => (
              <option key={value} value={value}>
                {streams(value)}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}

/** Free-text subject with suggestions from the existing list. */
export function SubjectField({
  props,
  subjects,
  error,
  idPrefix,
}: {
  props: UseFormRegisterReturn;
  subjects: string[];
  error?: string;
  idPrefix: string;
}) {
  const t = useTranslations("content");
  const listId = `${idPrefix}-subjects`;

  return (
    <div>
      <Label htmlFor={`${idPrefix}-subject`}>{t("subject")}</Label>
      <Input
        id={`${idPrefix}-subject`}
        list={listId}
        autoComplete="off"
        maxLength={60}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <datalist id={listId}>
        {subjects.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("subjectHint")}</p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
