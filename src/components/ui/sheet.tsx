"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

/** Bottom sheet: the standard pattern for pickers and menus on mobile. */
export function SheetContent({
  title,
  closeLabel,
  className,
  children,
}: {
  title: string;
  closeLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Close
            aria-label={closeLabel}
            className="flex size-11 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <X className="size-5" aria-hidden />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
