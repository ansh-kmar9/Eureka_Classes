import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The branded loading screen: the app's lightbulb inside a softly pulsing ring.
 * `fullscreen` fills the page; otherwise it sits inside whatever area is loading.
 */
export function PageLoader({
  label,
  fullscreen = false,
}: {
  label: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullscreen ? "min-h-dvh" : "min-h-[55dvh]",
      )}
    >
      <div className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/15 [animation-duration:2s]" />
        <span className="absolute inset-1 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-primary [animation-duration:1.2s]" />
        <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Lightbulb className="size-6" aria-hidden />
        </span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
