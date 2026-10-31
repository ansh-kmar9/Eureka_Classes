"use client";

import { useTransition } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { clearSavedCopies } from "@/features/auth/clear-saved";

const itemClass =
  "flex h-11 cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 text-sm font-medium outline-none data-[highlighted]:bg-surface-muted";

/** The round profile picture in the header. Opens a small menu with Profile and Sign out. */
export function ProfileMenu({
  name,
  email,
  avatarUrl,
  profileHref,
  labels,
}: {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  profileHref: string;
  labels: { menu: string; profile: string; signOut: string };
}) {
  const [pending, startTransition] = useTransition();
  const initial = (name ?? email).trim().charAt(0).toUpperCase();

  function handleSignOut() {
    startTransition(async () => {
      await clearSavedCopies();
      await signOut();
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={labels.menu}
        className="ml-1 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-ring"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initial
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[60] w-64 max-w-[calc(100vw-1.5rem)] rounded-card border border-border bg-surface p-1.5 shadow-lg"
        >
          <div className="border-b border-border px-3 pb-2.5 pt-2">
            {name && <p className="break-words text-sm font-semibold leading-snug">{name}</p>}
            <p className="break-all text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="pt-1.5">
            <DropdownMenu.Item asChild>
              <Link href={profileHref} className={itemClass}>
                <User className="size-4" aria-hidden />
                {labels.profile}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled={pending}
              onSelect={(event) => {
                // Keep the menu open until the redirect, so the button can show it is working.
                event.preventDefault();
                handleSignOut();
              }}
              className={`${itemClass} text-danger data-[disabled]:opacity-60`}
            >
              <LogOut className="size-4" aria-hidden />
              {labels.signOut}
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
