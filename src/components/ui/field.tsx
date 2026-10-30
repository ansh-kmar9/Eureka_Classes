import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-control border border-border bg-surface px-3.5 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-danger disabled:opacity-60";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "min-h-28 py-2.5", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(controlClass, "h-11", className)} {...props} />;
}

export function FieldError({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      className={cn("mt-1.5 text-sm text-danger", className)}
      {...props}
    />
  );
}
