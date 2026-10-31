import Image from "next/image";
import { cn } from "@/lib/utils";

/** The Eureka artwork: a glowing bulb rising from an open book. Decorative, so it has no alt text. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/logo-mark.png"
      alt=""
      width={160}
      height={158}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
