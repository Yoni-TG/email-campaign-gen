"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductPicker } from "@/modules/products/components/product-picker";
import {
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TYPES,
  LEAD_PERSONALITIES,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUES,
  LEAD_VALUE_LABELS,
} from "@/lib/types";
import type { CampaignType, LeadPersonality } from "@/lib/types";
import { useCreativeSeedForm } from "@/modules/campaigns/hooks/use-creative-seed-form";

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-gray-200 bg-white hover:bg-gray-50"
  }`;

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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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

      <div className="space-y-1.5">
        <Label htmlFor="campaignType">Campaign Type *</Label>
        <select
          id="campaignType"
          value={state.campaignType}
          onChange={(e) => setField("campaignType", e.target.value as CampaignType)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          {CAMPAIGN_TYPES.map((value) => (
            <option key={value} value={value}>
              {CAMPAIGN_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
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

      <div className="space-y-1.5">
        <Label>Lead Value *</Label>
        <p className="text-sm text-muted-foreground">
          Which brand value the campaign leans on.
        </p>
        <div className="flex flex-wrap gap-2">
          {LEAD_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("leadValue", value)}
              className={chipClass(state.leadValue === value)}
            >
              {LEAD_VALUE_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Lead Personalities *</Label>
        <p className="text-sm text-muted-foreground">
          One or more — shapes the layout mood and voice.
        </p>
        <div className="flex flex-wrap gap-2">
          {LEAD_PERSONALITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePersonality(p as LeadPersonality)}
              className={chipClass(state.leadPersonalities.includes(p))}
            >
              {LEAD_PERSONALITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

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
        <Label>Pin Specific Products</Label>
        <p className="text-sm text-muted-foreground">
          Optional — these products will always appear in the selection.
        </p>
        <ProductPicker
          selected={state.pinnedProducts}
          onChange={(products) => setField("pinnedProducts", products)}
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeSms"
          checked={state.includeSms}
          onChange={(e) => setField("includeSms", e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="includeSms" className="cursor-pointer">
          Include SMS copy
        </Label>
      </div>

      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Campaign"}
      </Button>
    </form>
  );
}
