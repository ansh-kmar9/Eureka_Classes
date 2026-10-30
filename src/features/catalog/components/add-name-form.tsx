"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

/** One-line "type a name, press Add" form used for new subjects and new topics. */
export function AddNameForm({
  label,
  placeholder,
  maxLength,
  submit,
}: {
  label: string;
  placeholder?: string;
  maxLength: number;
  /** Runs the Server Action; resolves with the result so duplicates can be reported. */
  submit: (input: { name: string }) => Promise<{ ok: boolean; error?: "duplicate" }>;
}) {
  const t = useTranslations("catalog");
  const [name, setName] = useState("");
  const [error, setError] = useState<"duplicate" | "failed" | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await submit({ name });
      if (result.ok) setName("");
      else setError(result.error === "duplicate" ? "duplicate" : "failed");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={label}
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !name.trim()} className="shrink-0">
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error === "duplicate" ? t("duplicate") : t("failed")}
        </p>
      )}
    </form>
  );
}
