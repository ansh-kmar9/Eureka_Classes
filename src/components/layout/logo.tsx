import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={site.name}
      className={cn("flex items-center gap-2.5 font-bold", className)}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Lightbulb className="size-5" aria-hidden />
      </span>
      {/* The name is hidden on phones to save header space; the icon and aria-label remain. */}
      <span className="hidden text-lg tracking-tight sm:inline">{site.name}</span>
    </Link>
  );
}
