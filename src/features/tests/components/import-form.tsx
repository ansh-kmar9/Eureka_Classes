"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ImportResult } from "../actions";

/** Paste many questions at once, as plain text or JSON. */
export function ImportForm({
  run,
  disabled,
  max,
}: {
  /** Server Action that imports the questions, already bound to its test. */
  run: (input: unknown) => Promise<ImportResult>;
  disabled: boolean;
  /** Largest number of questions the test may hold. */
  max: number;
}) {
  const t = useTranslations("testsAdmin.import");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const [content, setContent] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await run({ content });
      setResult(outcome);
      if (outcome.ok) {
        setContent("");
        toast.success(toasts("imported", { count: outcome.added }));
      }
    });
  };

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-semibold">{t("title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("hint")}</p>

      <details className="mb-4 rounded-control bg-surface-muted p-3 text-sm">
        <summary className="cursor-pointer font-medium">{t("exampleTitle")}</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
          {t("example")}
        </pre>
      </details>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="import-content">{t("label")}</Label>
          <Textarea
            id="import-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={disabled || pending}
            maxLength={60000}
            className="min-h-48 font-mono text-sm"
            spellCheck={false}
          />
        </div>

        {result?.ok && (
          <p role="status" className="text-sm text-success">
            {t("success", { count: result.added })}
          </p>
        )}
        {result && !result.ok && (
          <FieldError>
            {t(`errors.${result.reason}`, { position: result.position ?? 0, max })}
          </FieldError>
        )}

        <Button type="submit" disabled={disabled || pending || !content.trim()}>
          {pending ? t("importing") : t("import")}
        </Button>
      </form>
    </Card>
  );
}
