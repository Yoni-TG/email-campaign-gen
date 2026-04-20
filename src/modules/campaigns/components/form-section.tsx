import type { ComponentType, ReactNode } from "react";

interface LucideIconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

interface FormSectionProps {
  title: string;
  hint?: string;
  icon: ComponentType<LucideIconProps>;
  children: ReactNode;
}

// Icon-tile + title + optional hint. Title sits center-aligned with the
// tile so the header reads as a single unit. Sections are delineated by
// spacing alone — no dividers.
export function FormSection({
  title,
  hint,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-inset ring-accent/20"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </header>
      <div className="space-y-4 pl-0 sm:pl-[52px]">{children}</div>
    </section>
  );
}
