"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Campaign,
  CampaignType,
  CreativeSeed,
  LeadPersonality,
  LeadValue,
  Market,
  ProductSnapshot,
} from "@/lib/types";

export interface CreativeSeedFormState {
  name: string;
  campaignType: CampaignType;
  targetCategories: string[];
  promoDetails: string;
  mainMessage: string;
  secondaryMessage: string;
  additionalNotes: string;
  includeSms: boolean;
  includeNicky: boolean;
  leadValue: LeadValue;
  leadPersonalities: LeadPersonality[];
  pinnedProducts: ProductSnapshot[];
  market: Market;
}

export type CreativeSeedFieldKey =
  | "name"
  | "mainMessage"
  | "targetCategories"
  | "leadPersonalities";

export type CreativeSeedErrors = Record<CreativeSeedFieldKey, string | null>;
export type CreativeSeedTouched = Record<CreativeSeedFieldKey, boolean>;

export interface UseCreativeSeedFormResult {
  state: CreativeSeedFormState;
  setField: <K extends keyof CreativeSeedFormState>(
    key: K,
    value: CreativeSeedFormState[K],
  ) => void;
  toggleCategory: (cat: string) => void;
  togglePersonality: (p: LeadPersonality) => void;
  categories: string[];
  isCategoriesLoading: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  errors: CreativeSeedErrors;
  touched: CreativeSeedTouched;
  markTouched: (key: CreativeSeedFieldKey) => void;
  submit: () => Promise<void>;
}

const EMPTY: CreativeSeedFormState = {
  name: "",
  campaignType: "product_launch",
  targetCategories: [],
  promoDetails: "",
  mainMessage: "",
  secondaryMessage: "",
  additionalNotes: "",
  includeSms: false,
  includeNicky: false,
  leadValue: "family_first",
  leadPersonalities: [],
  pinnedProducts: [],
  market: "us",
};

const EMPTY_TOUCHED: CreativeSeedTouched = {
  name: false,
  mainMessage: false,
  targetCategories: false,
  leadPersonalities: false,
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function computeErrors(state: CreativeSeedFormState): CreativeSeedErrors {
  return {
    name: state.name.trim().length > 0 ? null : "Give the campaign a name.",
    mainMessage:
      state.mainMessage.trim().length > 0
        ? null
        : "Describe the core theme or angle.",
    targetCategories:
      state.targetCategories.length > 0
        ? null
        : "Pick at least one category.",
    leadPersonalities:
      state.leadPersonalities.length > 0
        ? null
        : "Pick at least one personality.",
  };
}

function stateToSeed(state: CreativeSeedFormState): CreativeSeed {
  return {
    targetCategories: state.targetCategories,
    promoDetails: state.promoDetails || undefined,
    mainMessage: state.mainMessage,
    secondaryMessage: state.secondaryMessage || undefined,
    pinnedSkus: state.pinnedProducts.map((p) => p.sku),
    additionalNotes: state.additionalNotes || undefined,
    includeSms: state.includeSms,
    includeNicky: state.includeNicky,
    leadValue: state.leadValue,
    leadPersonalities: state.leadPersonalities,
    market: state.market,
  };
}

// Wraps the new-campaign form: state, validation, categories fetch, and the
// create+generate+redirect submit flow. Keeps the form component a thin view.
export function useCreativeSeedForm(): UseCreativeSeedFormResult {
  const router = useRouter();
  const [state, setState] = useState<CreativeSeedFormState>(EMPTY);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<CreativeSeedTouched>(EMPTY_TOUCHED);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField: UseCreativeSeedFormResult["setField"] = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (cat: string) => {
    setState((prev) => ({
      ...prev,
      targetCategories: toggle(prev.targetCategories, cat),
    }));
    setTouched((prev) => ({ ...prev, targetCategories: true }));
  };

  const togglePersonality = (p: LeadPersonality) => {
    setState((prev) => ({
      ...prev,
      leadPersonalities: toggle(prev.leadPersonalities, p),
    }));
    setTouched((prev) => ({ ...prev, leadPersonalities: true }));
  };

  const markTouched = (key: CreativeSeedFieldKey) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const errors = computeErrors(state);
  const isValid = Object.values(errors).every((e) => e === null);

  const submit = async () => {
    if (isSubmitting) return;
    if (!isValid) {
      setTouched({
        name: true,
        mainMessage: true,
        targetCategories: true,
        leadPersonalities: true,
      });
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          campaignType: state.campaignType,
          createdBy: "team",
          seed: stateToSeed(state),
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create campaign");
      }

      const campaign = (await createRes.json()) as Campaign;

      // Fire-and-forget generation — the detail page polls for status.
      void fetch(`/api/campaigns/${campaign.id}/generate`, { method: "POST" });

      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create campaign";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return {
    state,
    setField,
    toggleCategory,
    togglePersonality,
    categories,
    isCategoriesLoading,
    isValid,
    isSubmitting,
    errors,
    touched,
    markTouched,
    submit,
  };
}
