"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";
import { useToast } from "./toast";

export interface ConfirmCopy {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Runs a Server Action with a spinner while it works, a toast when it succeeds
 * (if `successMessage` is given) and a toast if it fails.
 * With `confirm`, asks first: use it for anything destructive.
 */
export function ActionButton({
  action,
  confirm,
  successMessage,
  children,
  ...buttonProps
}: Omit<ButtonProps, "onClick" | "type"> & {
  action: () => Promise<{ ok: boolean } | void>;
  confirm?: ConfirmCopy;
  /** Shown as a toast after the action succeeds. */
  successMessage?: string;
}) {
  const errors = useTranslations("errors");
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = () =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result && !result.ok) {
          toast.error(errors("generic"));
          return;
        }
        if (successMessage) toast.success(successMessage);
        setOpen(false);
      } catch {
        toast.error(errors("generic"));
      }
    });

  return (
    <>
      <Button
        {...buttonProps}
        disabled={pending || buttonProps.disabled}
        aria-busy={pending}
        onClick={confirm ? () => setOpen(true) : run}
      >
        {pending && !open ? (
          <>
            <Spinner />
            {buttonProps.size !== "icon" && children}
          </>
        ) : (
          children
        )}
      </Button>

      {confirm && (
        <Dialog.Root open={open} onOpenChange={(next) => !pending && setOpen(next)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-surface p-5"
            >
              <Dialog.Title className="text-lg font-semibold">{confirm.title}</Dialog.Title>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {confirm.description}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" disabled={pending}>
                    {confirm.cancelLabel}
                  </Button>
                </Dialog.Close>
                <Button
                  variant={buttonProps.variant === "danger" ? "danger" : "primary"}
                  onClick={run}
                  disabled={pending}
                  aria-busy={pending}
                >
                  {pending && <Spinner />}
                  {confirm.confirmLabel}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
