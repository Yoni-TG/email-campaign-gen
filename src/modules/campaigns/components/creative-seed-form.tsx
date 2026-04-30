"use client";

import type { FormEvent, ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductPicker } from "@/modules/products/components/product-picker";
import {
  CAMPAIGN_TYPE_DESCRIPTIONS,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TYPES,
  LEAD_PERSONALITIES,
  LEAD_PERSONALITY_DESCRIPTIONS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_DESCRIPTIONS,
  LEAD_VALUE_LABELS,
  LEAD_VALUES,
  MARKETS,
  MARKET_LABELS,
} from "@/lib/types";
import type {
  CampaignType,
  LeadPersonality,
  LeadValue,
  Market,
} from "@/lib/types";
import {
  MAX_LEAD_PERSONALITIES,
  useCreativeSeedForm,
  type CreativeSeedFormMode,
  type CreativeSeedFormState,
} from "@/modules/campaigns/hooks/use-creative-seed-form";
import { useAutoGrowTextarea } from "@/lib/use-auto-grow-textarea";
import { cn } from "@/lib/utils";

// Brief view (Step 1 of the wizard). All schema-backed fields are still
// surfaced — the visual change is the design language: warm surface-2
// page bg, generous spacing, uppercase ink-3 field labels, plum primary
// CTA, ink chips for voice picks. Hovers darken borders rather than
// shifting bg, since the page sits on surface-2 and a `bg-surface-2`
// hover would blend the field into the page.
interface CreativeSeedFormProps {
  /** Defaults to create mode. Edit mode pre-fills state from `initial`,
   *  swaps the header/CTA copy, and PATCHes the existing campaign. */
  mode?: CreativeSeedFormMode;
  initial?: Partial<CreativeSeedFormState>;
}

export function CreativeSeedForm({ mode, initial }: CreativeSeedFormProps = {}) {
  const isEdit = mode?.kind === "edit";
  const {
    state,
    setField,
    toggleCategory,
    togglePersonality,
    categories,
    isCategoriesLoading,
    isSubmitting,
    errors,
    touched,
    markTouched,
    submit,
  } = useCreativeSeedForm({ mode, initial });
  const mainMessageRef = useAutoGrowTextarea(state.mainMessage);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-2 px-6 py-12 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-2xl space-y-12"
      >
        <header>
          <h1 className="font-display text-4xl leading-tight text-ink">
            {isEdit ? "Edit the brief" : "Tell us about the campaign"}
          </h1>
          <p className="mt-3 text-sm text-ink-3">
            {isEdit
              ? "Updates apply on save. Existing copy and products stay as they are."
              : "We'll generate copy from this. Edit anything later."}
          </p>
        </header>

        <Section title="Basics">
          <Field
            label="Campaign name"
            htmlFor="name"
            required
            error={touched.name ? errors.name : null}
          >
            <input
              id="name"
              value={state.name}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => markTouched("name")}
              placeholder="e.g. Christmas sale — first season drop"
              aria-invalid={touched.name && !!errors.name}
              className={textInputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Campaign type"
              htmlFor="campaignType"
              required
              hint="Shifts copy framing. Hover an option for detail."
            >
              <SelectLikeWrap>
                <Tooltip>
                  <TooltipTrigger
                    render={(props) => (
                      <select
                        id="campaignType"
                        value={state.campaignType}
                        onChange={(e) =>
                          setField(
                            "campaignType",
                            e.target.value as CampaignType,
                          )
                        }
                        className={selectClass}
                        required
                        {...props}
                      >
                        {CAMPAIGN_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {CAMPAIGN_TYPE_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <TooltipContent>
                    {CAMPAIGN_TYPE_DESCRIPTIONS[state.campaignType]}
                  </TooltipContent>
                </Tooltip>
              </SelectLikeWrap>
            </Field>

            <Field
              label="Market"
              htmlFor="market"
              required
              hint="Drives US vs UK spelling."
            >
              <SelectLikeWrap>
                <select
                  id="market"
                  value={state.market}
                  onChange={(e) => setField("market", e.target.value as Market)}
                  className={selectClass}
                  required
                >
                  {MARKETS.map((value) => (
                    <option key={value} value={value}>
                      {MARKET_LABELS[value]}
                    </option>
                  ))}
                </select>
              </SelectLikeWrap>
            </Field>
          </div>

          <div className="space-y-3">
            <CheckboxRow
              id="includeSms"
              checked={state.includeSms}
              onChange={(v) => setField("includeSms", v)}
            >
              Include SMS copy
            </CheckboxRow>
            <CheckboxRow
              id="includeNicky"
              checked={state.includeNicky}
              onChange={(v) => setField("includeNicky", v)}
              hint="Off by default — Claude generates one only when this is on. You can also add one later from the fine-tune editor."
            >
              Include a Nicky Hilton quote
            </CheckboxRow>
          </div>
        </Section>

        <Section title="Brief">
          <Field
            label="Main message"
            htmlFor="mainMessage"
            required
            hint="What you're saying, why now, what's special."
            error={touched.mainMessage ? errors.mainMessage : null}
          >
            <textarea
              id="mainMessage"
              ref={mainMessageRef}
              rows={3}
              value={state.mainMessage}
              onChange={(e) => setField("mainMessage", e.target.value)}
              onBlur={() => markTouched("mainMessage")}
              placeholder="Core theme or angle for the campaign"
              aria-invalid={touched.mainMessage && !!errors.mainMessage}
              style={{ overflow: "hidden" }}
              className={cn(
                textInputClass,
                "min-h-[96px] resize-none leading-relaxed",
              )}
            />
          </Field>

          <Field label="Secondary message" htmlFor="secondaryMessage">
            <textarea
              id="secondaryMessage"
              rows={2}
              value={state.secondaryMessage}
              onChange={(e) => setField("secondaryMessage", e.target.value)}
              placeholder="Supporting message or secondary CTA"
              className={cn(textInputClass, "resize-y leading-relaxed")}
            />
          </Field>

          <Field label="Promo details" htmlFor="promoDetails">
            <input
              id="promoDetails"
              value={state.promoDetails}
              onChange={(e) => setField("promoDetails", e.target.value)}
              placeholder='e.g. "20% OFF", "Free Shipping", discount code'
              className={textInputClass}
            />
          </Field>

          <Field label="Additional notes" htmlFor="additionalNotes">
            <textarea
              id="additionalNotes"
              rows={2}
              value={state.additionalNotes}
              onChange={(e) => setField("additionalNotes", e.target.value)}
              placeholder="Any extra instructions for the generator"
              className={cn(textInputClass, "resize-y leading-relaxed")}
            />
          </Field>
        </Section>

        <Section
          title="Voice"
          hint="Shapes the tone of the generated copy and the wireframe's layout mood."
        >
          <FieldGroup label="Lead value" required>
            <div className="flex flex-wrap gap-2">
              {LEAD_VALUES.map((v) => (
                <ChipWithTooltip
                  key={v}
                  active={state.leadValue === v}
                  onClick={() => setField("leadValue", v as LeadValue)}
                  label={LEAD_VALUE_LABELS[v]}
                  tooltip={LEAD_VALUE_DESCRIPTIONS[v]}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup
            label="Lead personalities"
            required
            hint="Pick 1–3 — they stack to shape voice and layout mood."
            error={touched.leadPersonalities ? errors.leadPersonalities : null}
          >
            <div className="flex flex-wrap gap-2">
              {LEAD_PERSONALITIES.map((p) => {
                const active = state.leadPersonalities.includes(p);
                const atCap =
                  state.leadPersonalities.length >= MAX_LEAD_PERSONALITIES;
                return (
                  <ChipWithTooltip
                    key={p}
                    active={active}
                    disabled={!active && atCap}
                    onClick={() => togglePersonality(p as LeadPersonality)}
                    label={LEAD_PERSONALITY_LABELS[p]}
                    tooltip={LEAD_PERSONALITY_DESCRIPTIONS[p]}
                  />
                );
              })}
            </div>
          </FieldGroup>
        </Section>

        <Section title="Audience & Products">
          <FieldGroup
            label="Target categories"
            required
            hint="We'll pull featured products from these."
            error={touched.targetCategories ? errors.targetCategories : null}
          >
            <div className="flex flex-wrap gap-2">
              {isCategoriesLoading && (
                <p className="text-sm text-ink-3">Loading categories…</p>
              )}
              {!isCategoriesLoading && categories.length === 0 && (
                <p className="text-sm text-ink-3">
                  No categories available. Check PRODUCT_FEED_URL.
                </p>
              )}
              {categories.map((cat) => (
                <CategoryChip
                  key={cat}
                  label={cat}
                  active={state.targetCategories.includes(cat)}
                  onClick={() => toggleCategory(cat)}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup
            label="Pinned products"
            hint="Optional — these products will always appear in the selection."
          >
            <ProductPicker
              selected={state.pinnedProducts}
              onChange={(products) => setField("pinnedProducts", products)}
            />
          </FieldGroup>
        </Section>

        <div className="flex items-center justify-end gap-4 pt-2">
          {!isEdit && <span className="text-xs text-ink-3">~10 sec</span>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-surface shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 disabled:opacity-60"
          >
            {isSubmitting
              ? isEdit
                ? "Saving…"
                : "Generating…"
              : isEdit
                ? "Save brief"
                : "Generate copy"}
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Visual primitives (file-local, used only by Step 1 today) ───

const textInputClass =
  "block w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-4 transition-colors hover:border-border-strong focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const selectClass =
  "h-12 w-full appearance-none rounded-md border border-border bg-surface px-4 pr-10 text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wider text-ink-3";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <header className="space-y-1 border-b border-border pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
          {title}
        </p>
        {hint && <p className="text-xs text-ink-3">{hint}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required && <RequiredMark />}
      </label>
      {children}
      <FieldFooter hint={hint} error={error} />
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className={labelClass}>
        {label}
        {required && <RequiredMark />}
      </p>
      {children}
      <FieldFooter hint={hint} error={error} />
    </div>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 text-brand">
      *
    </span>
  );
}

function FieldFooter({
  hint,
  error,
}: {
  hint?: string;
  error?: string | null;
}) {
  if (error) return <p className="text-xs text-destructive">{error}</p>;
  if (hint) return <p className="text-xs text-ink-3">{hint}</p>;
  return null;
}

function CheckboxRow({
  id,
  checked,
  onChange,
  hint,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-2 transition-colors hover:border-border-strong"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-border accent-brand"
      />
      <span className="space-y-1">
        <span className="block text-ink">{children}</span>
        {hint && <span className="block text-xs text-ink-3">{hint}</span>}
      </span>
    </label>
  );
}

// Chip used for Lead Value (single-select) and Lead Personalities (multi).
// Wraps in a tooltip so the brand-guide description stays one hover away.
//
// base-ui's TooltipTrigger spreads its own onClick (used by click-to-dismiss);
// we have to spread `props` first then merge our chip's onClick afterwards
// — spreading `props` last would clobber our handler and the chip would
// stop responding to clicks (regression caught here previously).
function ChipWithTooltip({
  active,
  onClick,
  label,
  tooltip,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tooltip: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <button
            type="button"
            aria-pressed={active}
            disabled={disabled}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active
                ? "bg-ink text-surface hover:bg-ink-2"
                : "border border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
              disabled &&
                "cursor-not-allowed opacity-40 hover:border-border hover:text-ink-2",
            )}
            {...props}
            onClick={(event) => {
              props.onClick?.(event);
              onClick();
            }}
          >
            {label}
          </button>
        )}
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
        active
          ? "border border-brand bg-brand-soft font-medium text-brand hover:bg-brand-soft/80"
          : "border border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
      )}
    >
      {active && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      {label}
    </button>
  );
}

// Layered chevron over a native <select>. Keeps the dropdown affordance
// consistent with the rest of the form's bordered fields without losing
// native keyboard / a11y support.
function SelectLikeWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}
