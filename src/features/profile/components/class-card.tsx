"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Label, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { BoardType, ClassChangeRequest, StreamType } from "@/lib/supabase/types";
import { changeClass, withdrawClassRequest } from "../actions";
import {
  BOARD_VALUES,
  CLASS_VALUES,
  classChangeSchema,
  needsStream,
  STREAM_VALUES,
  type ClassChangeInput,
  type ClassChangeValues,
  type ValidationKey,
} from "../schemas";

type Notice = "updated" | "requested" | "same" | "duplicate" | "failed" | null;

/**
 * Pending students change class directly; approved students send a request
 * that a teacher reviews (`mode`).
 */
export function ClassCard({
  mode,
  currentBoard,
  currentClass,
  currentStream,
  pendingRequest,
}: {
  mode: "direct" | "request";
  currentBoard: BoardType | null;
  currentClass: number;
  currentStream: StreamType | null;
  pendingRequest: ClassChangeRequest | null;
}) {
  const t = useTranslations("profile");
  const toasts = useTranslations("toasts");
  const toast = useToast();
  const v = useTranslations("validation");
  const common = useTranslations("common");
  const streams = useTranslations("streams");
  const boards = useTranslations("boards");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<ClassChangeInput, unknown, ClassChangeValues>({
    resolver: zodResolver(classChangeSchema),
    defaultValues: {
      board: currentBoard ?? undefined,
      class: String(currentClass) as ClassChangeInput["class"],
      stream: currentStream ?? "",
    },
  });
  const selectedClass = useWatch({ control, name: "class" });
  const message = (key?: string) => (key ? v(key as ValidationKey) : undefined);

  const label = (board: BoardType | null, klass: number, stream: StreamType | null) =>
    [board ? boards(board) : null, common("classLabel", { n: klass }), stream ? streams(stream) : null]
      .filter(Boolean)
      .join(" · ");

  const onSubmit = handleSubmit(() => {
    setNotice(null);
    const raw = getValues();
    startTransition(async () => {
      const result = await changeClass(raw);
      if (result.ok) {
        setNotice(result.mode ?? "updated");
        toast.success(toasts(result.mode === "requested" ? "requestSent" : "classUpdated"));
      }
      else setNotice(result.error ?? "failed");
    });
  });

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-semibold">{t("classTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("currentClass")}:{" "}
          <span className="font-medium text-foreground">{label(currentBoard, currentClass, currentStream)}</span>
        </p>
      </div>

      {pendingRequest ? (
        <div className="space-y-3 rounded-control bg-accent-soft p-3 text-accent-foreground">
          <p className="text-sm font-medium">
            {t("requestPending", { value: label(pendingRequest.to_board ?? currentBoard, pendingRequest.to_class, pendingRequest.to_stream) })}
          </p>
          <ActionButton
            size="sm"
            variant="outline"
            action={withdrawClassRequest.bind(null, pendingRequest.id)}
          >
            {t("withdraw")}
          </ActionButton>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {mode === "request" ? t("helpRequest") : t("helpDirect")}
          </p>
          <div>
            <Label htmlFor="new-board">{t("board")}</Label>
            <Select id="new-board" aria-invalid={Boolean(errors.board)} {...register("board")}>
              {!currentBoard && (
                <option value="" disabled>
                  {t("boardPlaceholder")}
                </option>
              )}
              {BOARD_VALUES.map((value) => (
                <option key={value} value={value}>
                  {boards(value)}
                </option>
              ))}
            </Select>
            {errors.board && <FieldError>{message(errors.board.message)}</FieldError>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-class">{t("newClass")}</Label>
              <Select id="new-class" aria-invalid={Boolean(errors.class)} {...register("class")}>
                {CLASS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {common("classLabel", { n: value })}
                  </option>
                ))}
              </Select>
              {errors.class && <FieldError>{message(errors.class.message)}</FieldError>}
            </div>
            {selectedClass && needsStream(selectedClass) && (
              <div>
                <Label htmlFor="new-stream">{t("stream")}</Label>
                <Select id="new-stream" aria-invalid={Boolean(errors.stream)} {...register("stream")}>
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
          </div>

          {notice && (
            <p
              role="status"
              className={notice === "updated" || notice === "requested" ? "text-sm text-success" : "text-sm text-danger"}
            >
              {t(`notice.${notice}`)}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? t("sending") : mode === "request" ? t("sendRequest") : t("updateClass")}
          </Button>
        </form>
      )}
    </Card>
  );
}
