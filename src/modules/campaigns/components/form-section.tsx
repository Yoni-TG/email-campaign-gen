import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

// Groups a vertical stack of fields under a small uppercase heading.
// Used by the creative-seed form to break the long brief into four
// scannable sections (Basics, Brief, Voice, Audience & Products).
export function FormSection({ title, hint, children }: FormSectionProps) {
  return (
    <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <header className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
