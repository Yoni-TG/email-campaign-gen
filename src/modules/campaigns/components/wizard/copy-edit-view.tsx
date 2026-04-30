"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Sparkles, X } from "lucide-react";
import { ProductGrid } from "@/modules/products/components/product-grid";
import { ProductSearchAdd } from "@/modules/products/components/product-search-add";
import { useReviewForm } from "@/modules/campaigns/hooks/use-review-form";
import { cn } from "@/lib/utils";
import type {
  ApprovedCopy,
  BodyBlock,
  Campaign,
  GeneratedCopy,
  ProductSnapshot,
  SubjectVariant,
} from "@/lib/types";
import { BriefRail } from "./brief-rail";
import { WizardActionBar } from "./wizard-action-bar";

const SUBJECT_TARGET = 50;
const SMS_MAX = 130;

interface Props {
  campaign: Campaign;
  generatedCopy: GeneratedCopy;
  generatedProducts: ProductSnapshot[];
}

// Step 2 (Copy) — Direction A. Two-column layout: editable copy on the
// left, sticky read-only brief rail on the right. Approve persists copy
// + product edits via the existing /approve API and routes the operator
// on to step 3 (Layout).
export function CopyEditView({ campaign, generatedCopy, generatedProducts }: Props) {
  const {
    approvedCopy,
    setApprovedCopy,
    products,
    setProducts,
    addProduct,
    isApproving,
    approve,
  } = useReviewForm({
    campaignId: campaign.id,
    generatedCopy,
    generatedProducts,
    initialApprovedCopy: campaign.approvedCopy,
    initialApprovedProducts: campaign.approvedProducts,
    // Push to step 3 once /approve succeeds.
    onSuccess: (router) => router.push(`/campaigns/${campaign.id}/layout`),
  });

  const subject = approvedCopy.subject_variant.subject;
  const preheader = approvedCopy.subject_variant.preheader;
  const subjectOver = subject.length > SUBJECT_TARGET;
  const existingSkus = new Set(products.map((p) => p.sku));

  const patch = (partial: Partial<ApprovedCopy>) =>
    setApprovedCopy({ ...approvedCopy, ...partial });

  const patchSubjectVariant = (partial: Partial<SubjectVariant>) =>
    patch({
      subject_variant: { ...approvedCopy.subject_variant, ...partial },
    });

  return (
    <div className="flex min-h-[calc(100vh-4rem-4rem)] flex-col bg-surface-2">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <main className="space-y-10 px-6 py-10 sm:px-10">
          <SubjectSection
            subject={subject}
            preheader={preheader}
            variants={generatedCopy.subject_variants}
            chosen={approvedCopy.subject_variant}
            onChooseVariant={(v) => patch({ subject_variant: { ...v } })}
            onSubjectChange={(value) => patchSubjectVariant({ subject: value })}
            onPreheaderChange={(value) =>
              patchSubjectVariant({ preheader: value })
            }
            subjectOver={subjectOver}
          />

          <BlocksSection
            blocks={approvedCopy.body_blocks}
            onChange={(next) => patch({ body_blocks: next })}
          />

          <ProductsSection
            products={products}
            existingSkus={existingSkus}
            onChange={setProducts}
            onAdd={addProduct}
          />

          <AdvancedSection
            value={approvedCopy}
            onChange={setApprovedCopy}
          />
        </main>

        <BriefRail
          seed={campaign.seed}
          editHref={`/campaigns/${campaign.id}`}
        />
      </div>

      <WizardActionBar
        backHref={`/campaigns/${campaign.id}`}
        primary={
          <button
            type="button"
            onClick={() => void approve()}
            disabled={isApproving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApproving ? "Saving…" : "Generate layouts →"}
          </button>
        }
      />
    </div>
  );
}

// ─── Subject + preheader ───

function SubjectSection({
  subject,
  preheader,
  variants,
  chosen,
  onChooseVariant,
  onSubjectChange,
  onPreheaderChange,
  subjectOver,
}: {
  subject: string;
  preheader: string;
  variants: SubjectVariant[];
  chosen: SubjectVariant;
  onChooseVariant: (variant: SubjectVariant) => void;
  onSubjectChange: (value: string) => void;
  onPreheaderChange: (value: string) => void;
  subjectOver: boolean;
}) {
  const showVariants = variants.length > 1;
  return (
    <section className="space-y-4">
      <FieldLabel>Subject line</FieldLabel>
      <input
        type="text"
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        className={inputClass}
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span
          className={cn(
            "tabular-nums",
            subjectOver ? "text-destructive" : "text-ink-3",
          )}
        >
          {subject.length} / {SUBJECT_TARGET} chars
        </span>
        {showVariants && (
          <VariantSwitcher
            variants={variants}
            chosen={chosen}
            onPick={onChooseVariant}
          />
        )}
      </div>

      <FieldLabel>Preheader</FieldLabel>
      <input
        type="text"
        value={preheader}
        onChange={(e) => onPreheaderChange(e.target.value)}
        className={inputClass}
      />
    </section>
  );
}

// Inline alternatives picker — replaces the brief's popover-based
// "See N alternatives". When the LLM emits multiple subject variants we
// show them as compact pickable cards under the subject input.
function VariantSwitcher({
  variants,
  chosen,
  onPick,
}: {
  variants: SubjectVariant[];
  chosen: SubjectVariant;
  onPick: (v: SubjectVariant) => void;
}) {
  return (
    <details className="group inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-brand hover:underline">
        <Sparkles className="size-3" aria-hidden />
        See {variants.length} alternatives
      </summary>
      <ul className="mt-3 space-y-2">
        {variants.map((variant, i) => {
          const active =
            variant.subject === chosen.subject &&
            variant.preheader === chosen.preheader;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPick(variant)}
                className={cn(
                  "block w-full rounded-md border-2 bg-surface px-3 py-2 text-left transition-colors",
                  active
                    ? "border-brand"
                    : "border-border hover:border-border-strong",
                )}
              >
                <p className="text-sm font-medium text-ink">{variant.subject}</p>
                <p className="mt-0.5 text-xs text-ink-3">{variant.preheader}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

// ─── Body blocks ───

function BlocksSection({
  blocks,
  onChange,
}: {
  blocks: BodyBlock[];
  onChange: (next: BodyBlock[]) => void;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };
  const remove = (i: number) =>
    onChange(blocks.filter((_, idx) => idx !== i));
  const patchBlock = (i: number, partial: Partial<BodyBlock>) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...partial } : b)));
  const add = () =>
    onChange([...blocks, { title: null, description: null, cta: null }]);

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <FieldLabel>Sections</FieldLabel>
        <span className="text-xs text-ink-3">
          {blocks.length} block{blocks.length === 1 ? "" : "s"} · use ↑↓ to reorder
        </span>
      </header>
      <ul className="space-y-3">
        {blocks.map((block, i) => (
          <li key={i}>
            <BlockCard
              index={i}
              total={blocks.length}
              block={block}
              onMove={(dir) => move(i, dir)}
              onRemove={() => remove(i)}
              onPatch={(partial) => patchBlock(i, partial)}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong bg-transparent px-4 py-3 text-sm text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
      >
        <Plus className="size-3.5" aria-hidden />
        Add section
      </button>
    </section>
  );
}

function BlockCard({
  index,
  total,
  block,
  onMove,
  onRemove,
  onPatch,
}: {
  index: number;
  total: number;
  block: BodyBlock;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onPatch: (partial: Partial<BodyBlock>) => void;
}) {
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <header className="flex items-start gap-3">
        <span
          className="mt-1 inline-flex select-none text-ink-4"
          aria-hidden
          title="Reorder via the arrow buttons →"
        >
          <GripVertical className="size-4" />
        </span>
        <p className="grow text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          Block {index + 1}
        </p>
        <div className="flex items-center gap-0.5 text-ink-3">
          <IconButton
            label={`Move block ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </IconButton>
          <IconButton
            label={`Move block ${index + 1} down`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </IconButton>
          <IconButton
            label={`Remove block ${index + 1}`}
            onClick={onRemove}
          >
            <X className="size-4" />
          </IconButton>
        </div>
      </header>

      <div className="mt-3 space-y-3">
        <input
          type="text"
          value={block.title ?? ""}
          onChange={(e) => onPatch({ title: emptyToNull(e.target.value) })}
          placeholder="Title"
          className="w-full bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-4"
        />
        <textarea
          value={block.description ?? ""}
          onChange={(e) =>
            onPatch({ description: emptyToNull(e.target.value) })
          }
          placeholder="Body copy"
          rows={3}
          className="w-full resize-none bg-transparent text-sm leading-6 text-ink-2 outline-none placeholder:text-ink-4"
        />
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
            CTA
          </span>
          <input
            type="text"
            value={block.cta ?? ""}
            onChange={(e) => onPatch({ cta: emptyToNull(e.target.value) })}
            placeholder="e.g. Shop holiday gifts"
            className="grow bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-4"
          />
        </div>
      </div>
    </article>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// ─── Products ───

function ProductsSection({
  products,
  existingSkus,
  onChange,
  onAdd,
}: {
  products: ProductSnapshot[];
  existingSkus: Set<string>;
  onChange: (next: ProductSnapshot[]) => void;
  onAdd: (product: ProductSnapshot) => void;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <FieldLabel>Products</FieldLabel>
        <span className="text-xs text-ink-3">{products.length} selected</span>
      </header>
      <ProductSearchAdd existingSkus={existingSkus} onAdd={onAdd} />
      <ProductGrid products={products} onChange={onChange} />
    </section>
  );
}

// ─── Advanced (free top text, SMS, Nicky quote) ───

function AdvancedSection({
  value,
  onChange,
}: {
  value: ApprovedCopy;
  onChange: (next: ApprovedCopy) => void;
}) {
  const patch = (partial: Partial<ApprovedCopy>) =>
    onChange({ ...value, ...partial });

  const smsLength = value.sms?.length ?? 0;

  return (
    <details className="group rounded-md border border-border bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink-2 hover:text-ink">
        <span className="inline-flex items-center gap-1.5">
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          Advanced
        </span>
        <span className="ml-2 text-xs text-ink-3">
          Free top text, SMS, Nicky quote
        </span>
      </summary>
      <div className="space-y-6 border-t border-border px-4 py-5">
        <div className="space-y-2">
          <FieldLabel>Free top text</FieldLabel>
          <input
            type="text"
            value={value.free_top_text ?? ""}
            onChange={(e) =>
              patch({ free_top_text: emptyToNull(e.target.value) })
            }
            placeholder="Optional banner above the hero"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <FieldLabel>SMS</FieldLabel>
            <span
              className={cn(
                "text-xs tabular-nums",
                smsLength >= SMS_MAX ? "text-destructive" : "text-ink-3",
              )}
            >
              {smsLength} / {SMS_MAX}
            </span>
          </div>
          <textarea
            value={value.sms ?? ""}
            onChange={(e) => patch({ sms: emptyToNull(e.target.value) })}
            rows={2}
            maxLength={SMS_MAX}
            placeholder="Use {link} as the URL placeholder"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Nicky quote</FieldLabel>
          <textarea
            value={value.nicky_quote?.quote ?? ""}
            onChange={(e) => {
              const quote = e.target.value;
              patch({
                nicky_quote: quote.trim().length
                  ? {
                      quote,
                      response: value.nicky_quote?.response ?? null,
                    }
                  : null,
              });
            }}
            rows={2}
            placeholder="Brand-guide §7 — clear to omit"
            className={cn(inputClass, "resize-none")}
          />
          <input
            type="text"
            value={value.nicky_quote?.response ?? ""}
            disabled={!value.nicky_quote}
            onChange={(e) =>
              patch({
                nicky_quote: value.nicky_quote
                  ? {
                      ...value.nicky_quote,
                      response: emptyToNull(e.target.value),
                    }
                  : null,
              })
            }
            placeholder='e.g. "Thank you Nicky!"'
            className={cn(inputClass, "disabled:opacity-50")}
          />
        </div>
      </div>
    </details>
  );
}

// ─── Shared ───

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
      {children}
    </p>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-border-strong focus:border-brand";

const emptyToNull = (v: string) => (v.trim().length > 0 ? v : null);
