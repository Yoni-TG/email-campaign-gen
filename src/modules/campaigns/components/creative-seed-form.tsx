"use client";

import type { FormEvent, ReactNode } from "react";
import {
  Info,
  FileText,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductPicker } from "@/modules/products/components/product-picker";
import { FormSection } from "./form-section";
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
import { useCreativeSeedForm } from "@/modules/campaigns/hooks/use-creative-seed-form";

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card hover:bg-muted"
  }`;

// Info icon that opens a short tooltip on hover/focus. Used next to labels
// where a one-line description earns its pixel cost.
function InfoHint({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <button
            type="button"
            aria-label="More info"
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            {...props}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      />
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

// Tooltip-wrapped chip. Used for lead-value and lead-personality pills so
// hovering a chip explains what it shifts in the AI output.
//
// base-ui's TooltipTrigger render-prop spreads its own onClick (used by the
// click-to-dismiss behavior) — we have to spread `props` FIRST, then merge
// our chip's onClick with whatever the trigger provided. Spreading `props`
// last would silently clobber our handler and the chip would stop responding
// to clicks (regression caught here).
function ChipWithTooltip({
  active,
  onClick,
  label,
  tooltip,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <button
            type="button"
            className={chipClass(active)}
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

export function CreativeSeedForm() {
  const {
    state,
    setField,
    toggleCategory,
    togglePersonality,
    categories,
    isCategoriesLoading,
    isValid,
    isSubmitting,
    submit,
  } = useCreativeSeedForm();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm"
    >
      <FormSection icon={FileText} title="Basics">
        <div className="space-y-1.5">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Mother's Day 2026"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="campaignType">Campaign Type *</Label>
              <InfoHint>
                Shifts copy framing. Hover each option below for detail.
              </InfoHint>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <select
                    id="campaignType"
                    value={state.campaignType}
                    onChange={(e) =>
                      setField("campaignType", e.target.value as CampaignType)
                    }
                    className="h-10 w-full rounded-lg border border-input/60 bg-muted/30 px-3.5 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-card focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
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
          </div>

          <div className="flex items-end">
            <label className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-input/60 bg-muted/30 px-3.5 text-sm transition-colors hover:bg-muted/50">
              <input
                type="checkbox"
                checked={state.includeSms}
                onChange={(e) => setField("includeSms", e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Include SMS copy</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="market">Market *</Label>
            <InfoHint>
              Drives US vs UK spelling + date format (brand-guide §8.6).
            </InfoHint>
          </div>
          <select
            id="market"
            value={state.market}
            onChange={(e) => setField("market", e.target.value as Market)}
            className="h-10 w-full rounded-lg border border-input/60 bg-muted/30 px-3.5 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-card focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
            required
          >
            {MARKETS.map((value) => (
              <option key={value} value={value}>
                {MARKET_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection icon={MessageSquareText} title="Brief">
        <div className="space-y-1.5">
          <Label htmlFor="mainMessage">Main Message *</Label>
          <Textarea
            id="mainMessage"
            value={state.mainMessage}
            onChange={(e) => setField("mainMessage", e.target.value)}
            placeholder="Core theme or angle for the campaign"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="secondaryMessage">Secondary Message</Label>
          <Textarea
            id="secondaryMessage"
            value={state.secondaryMessage}
            onChange={(e) => setField("secondaryMessage", e.target.value)}
            placeholder="Supporting message or secondary CTA"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promoDetails">Promo Details</Label>
          <Input
            id="promoDetails"
            value={state.promoDetails}
            onChange={(e) => setField("promoDetails", e.target.value)}
            placeholder='e.g. "20% OFF", "Free Shipping", discount code'
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            value={state.additionalNotes}
            onChange={(e) => setField("additionalNotes", e.target.value)}
            placeholder="Any extra instructions for the generator"
          />
        </div>
      </FormSection>

      <FormSection
        icon={Sparkles}
        title="Voice"
        hint="Shapes the tone of the generated copy and the wireframe's layout mood."
      >
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label>Lead Value *</Label>
            <InfoHint>Which brand value the campaign leans on.</InfoHint>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEAD_VALUES.map((value) => (
              <ChipWithTooltip
                key={value}
                active={state.leadValue === value}
                onClick={() => setField("leadValue", value as LeadValue)}
                label={LEAD_VALUE_LABELS[value]}
                tooltip={LEAD_VALUE_DESCRIPTIONS[value]}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label>Lead Personalities *</Label>
            <InfoHint>
              Pick one or more — they stack to shape voice and layout mood.
            </InfoHint>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEAD_PERSONALITIES.map((p) => (
              <ChipWithTooltip
                key={p}
                active={state.leadPersonalities.includes(p)}
                onClick={() => togglePersonality(p as LeadPersonality)}
                label={LEAD_PERSONALITY_LABELS[p]}
                tooltip={LEAD_PERSONALITY_DESCRIPTIONS[p]}
              />
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection icon={Users} title="Audience & Products">
        <div className="space-y-2">
          <Label>Target Categories *</Label>
          <div className="flex flex-wrap gap-2">
            {isCategoriesLoading && (
              <p className="text-sm text-muted-foreground">
                Loading categories…
              </p>
            )}
            {!isCategoriesLoading && categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No categories available. Check PRODUCT_FEED_URL.
              </p>
            )}
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={chipClass(state.targetCategories.includes(cat))}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pin Specific Products</Label>
          <p className="text-sm text-muted-foreground">
            Optional — these products will always appear in the selection.
          </p>
          <ProductPicker
            selected={state.pinnedProducts}
            onChange={(products) => setField("pinnedProducts", products)}
          />
        </div>
      </FormSection>

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="submit" disabled={!isValid || isSubmitting} size="lg">
          {isSubmitting ? "Creating…" : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}
