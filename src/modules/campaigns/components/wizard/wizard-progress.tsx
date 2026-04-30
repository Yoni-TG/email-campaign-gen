import Link from "next/link";
import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface StepDef {
  num: WizardStep;
  label: string;
  /** Path slug for the per-step route, used by `campaignId`-aware back-nav. */
  slug: string;
}

const STEPS: StepDef[] = [
  { num: 1, label: "Brief", slug: "brief" },
  { num: 2, label: "Copy", slug: "copy" },
  { num: 3, label: "Layout", slug: "layout" },
  { num: 4, label: "Images", slug: "images" },
  { num: 5, label: "Design", slug: "design" },
];

interface Props {
  currentStep: WizardStep;
  /** When provided, completed steps render as Links to
   *  /campaigns/[id]/<slug>. Future steps are never clickable, regardless. */
  campaignId?: string;
}

// Five-step indicator shared across the wizard. Matches the brief's
// progress affordance: numbered circle + label per step, thin rule
// connecting them. Past steps fill ink and show a check; the current
// step uses brand fill; future steps stay muted.
export function WizardProgress({ currentStep, campaignId }: Props) {
  return (
    <ol
      aria-label="Campaign generation progress"
      className="flex items-center gap-3"
    >
      {STEPS.map((step, i) => {
        const state: StepState =
          step.num < currentStep
            ? "past"
            : step.num === currentStep
              ? "current"
              : "future";
        const item = <StepItem step={step} state={state} />;
        const clickable = state === "past" && campaignId !== undefined;

        return (
          <Fragment key={step.num}>
            <li className="flex shrink-0 items-center">
              {clickable ? (
                <Link
                  href={`/campaigns/${campaignId}/${step.slug}`}
                  className="rounded-md transition-opacity hover:opacity-80"
                >
                  {item}
                </Link>
              ) : (
                item
              )}
            </li>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-6 shrink-0",
                  step.num < currentStep ? "bg-ink-2" : "bg-border-strong",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

type StepState = "past" | "current" | "future";

function StepItem({ step, state }: { step: StepDef; state: StepState }) {
  return (
    <span className="flex items-center gap-2">
      <StepCircle state={state}>
        {state === "past" ? (
          <Check className="size-3" strokeWidth={3} aria-hidden />
        ) : (
          step.num
        )}
      </StepCircle>
      <span
        className={cn(
          "text-sm whitespace-nowrap",
          state === "current" && "font-semibold text-ink",
          state === "past" && "text-ink-2",
          state === "future" && "text-ink-4",
        )}
      >
        {step.label}
      </span>
    </span>
  );
}

function StepCircle({
  state,
  children,
}: {
  state: StepState;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        state === "past" && "bg-ink text-surface",
        state === "current" && "bg-brand text-surface",
        state === "future" && "bg-surface-2 text-ink-4",
      )}
    >
      {children}
    </span>
  );
}
