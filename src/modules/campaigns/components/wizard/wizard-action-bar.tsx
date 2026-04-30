import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  /** Where the ghost Back link points. Past wizard step's route. */
  backHref: string;
  /** Right-side primary action — usually the step's "Continue →" button. */
  primary: ReactNode;
  /** Optional helper text rendered between back and primary (right-aligned). */
  helper?: ReactNode;
}

// Sticky bottom action bar shared across wizard steps. Left: Back. Right:
// the step's primary CTA, with optional helper text (e.g. "X of Y uploaded
// · M will use placeholders") floated next to it.
export function WizardActionBar({ backHref, primary, helper }: Props) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6 sm:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {helper && <span className="text-sm text-ink-3">{helper}</span>}
          {primary}
        </div>
      </div>
    </div>
  );
}
