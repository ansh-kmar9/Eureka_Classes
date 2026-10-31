"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";
import { clearSavedCopies } from "../clear-saved";

export function SignOutButton({
  label,
  variant = "outline",
}: {
  label: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form
      action={async () => {
        // Saved pages and PDFs belong to whoever was signed in, so they must not outlive the session.
        await clearSavedCopies();
        await signOut();
      }}
    >
      <Button type="submit" variant={variant}>
        <LogOut className="size-4" aria-hidden />
        {label}
      </Button>
    </form>
  );
}
