import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WizardProgress, type WizardStep } from "./wizard-progress";

interface Props {
  /** Title shown next to Cancel. Usually "New campaign" pre-creation,
   *  or "<campaign name> · <step>" once a draft exists. */
  title: string;
  currentStep: WizardStep;
  campaignId?: string;
  /** Where Cancel goes. Defaults to / (the campaigns list). */
  cancelHref?: string;
}

// Sticky top bar shared across the 5 wizard steps. Replaces the app's
// main top nav inside the wizard flow — the wizard owns the screen
// during creation, so a global nav would steal focus from the task.
export function WizardChrome({
  title,
  currentStep,
  campaignId,
  cancelHref = "/",
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 sm:px-8">
        <Link
          href={cancelHref}
          className="inline-flex items-center gap-1 text-sm text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Cancel
        </Link>
        <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
        <div className="ml-auto">
          <WizardProgress
            currentStep={currentStep}
            campaignId={campaignId}
          />
        </div>
      </div>
    </header>
  );
}
