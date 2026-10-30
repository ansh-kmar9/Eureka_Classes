import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

export function SignOutButton({
  label,
  variant = "outline",
}: {
  label: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form action={signOut}>
      <Button type="submit" variant={variant}>
        <LogOut className="size-4" aria-hidden />
        {label}
      </Button>
    </form>
  );
}
