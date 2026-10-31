import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { BrandMark } from "./brand-mark";

export function Logo({
  href = "/",
  className,
  showName = false,
}: {
  href?: string;
  className?: string;
  /** Show the name on phones too. By default it is hidden there to save header space. */
  showName?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={site.name}
      className={cn("flex items-center gap-2.5", className)}
    >
      <BrandMark className="size-11" />
      <span className={cn("flex-col leading-none", showName ? "flex" : "hidden sm:flex")}>
        <span className="brand-gradient pr-1 font-display text-[1.6rem] font-bold italic leading-[1.05] tracking-tight">
          Eureka
        </span>
        <span className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          Classes
        </span>
      </span>
    </Link>
  );
}
