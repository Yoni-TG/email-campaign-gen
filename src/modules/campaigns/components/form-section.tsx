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

// Icon-tile + title + optional hint. Sections are delineated by spacing,
// not borders — the tile carries enough visual weight to anchor the section.
export function FormSection({
  title,
  hint,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-inset ring-accent/15"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </header>
      <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
    </section>
  );
}
