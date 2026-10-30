import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("mx-auto w-full max-w-6xl px-4 py-10 md:py-14", className)}
    >
      {title && (
        <div className="mb-6 max-w-2xl md:mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
