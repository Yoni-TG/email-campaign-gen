"use client";

import { useCallback, useMemo, useState } from "react";
import { GripVertical, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProductGrid } from "@/modules/products/components/product-grid";
import { ProductSearchAdd } from "@/modules/products/components/product-search-add";
import { useReviewForm } from "@/modules/campaigns/hooks/use-review-form";
import { useAutoSave } from "@/lib/use-auto-save";
import { cn } from "@/lib/utils";
import { SMS_HARD_CAP, smsRenderedLength } from "@/lib/sms";
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

  // 800ms-debounced background save. Hits the generic PATCH endpoint —
  // no state transition, no re-render — so the operator's edits are
  // durable even if they close the tab before clicking "Generate
  // layouts →". The CTA still POSTs /approve, which both persists and
  // transitions; the autosave just covers the in-between.
  const formSnapshot = useMemo(
    () => ({ approvedCopy, products }),
    [approvedCopy, products],
  );
  const persist = useCallback(
    async ({
      approvedCopy: copy,
      products: prods,
    }: {
      approvedCopy: ApprovedCopy;
      products: ProductSnapshot[];
    }) => {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedCopy: copy, approvedProducts: prods }),
      });
      if (!res.ok) throw new Error("autosave failed");
    },
    [campaign.id],
  );
  const { status: saveStatus, savedAt } = useAutoSave(formSnapshot, persist);

  const patch = (partial: Partial<ApprovedCopy>) =>
    setApprovedCopy({ ...approvedCopy, ...partial });

  const patchSubjectVariant = (partial: Partial<SubjectVariant>) =>
    patch({
      subject_variant: { ...approvedCopy.subject_variant, ...partial },
    });

  return (
    <div className="flex min-h-[calc(100vh-4rem-4rem)] flex-col bg-surface-2">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <main className="space-y-5 px-6 py-10 sm:px-10">
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

          <FreeTopTextSection
            value={approvedCopy.free_top_text}
            onChange={(next) => patch({ free_top_text: next })}
          />

          <BlocksSection
            campaignId={campaign.id}
            blocks={approvedCopy.body_blocks}
            onChange={(next) => patch({ body_blocks: next })}
          />

          <SmsSection
            value={approvedCopy.sms}
            onChange={(next) => patch({ sms: next })}
          />

          <NickyQuoteSection
            value={approvedCopy.nicky_quote}
            onChange={(next) => patch({ nicky_quote: next })}
          />

          <ProductsSection
            products={products}
            existingSkus={existingSkus}
            onChange={setProducts}
            onAdd={addProduct}
          />
        </main>

        <BriefRail
          seed={campaign.seed}
          editHref={`/campaigns/${campaign.id}/brief`}
        />
      </div>

      <WizardActionBar
        backHref={`/campaigns/${campaign.id}`}
        saveStatus={saveStatus}
        saveSavedAt={savedAt}
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
  campaignId,
  blocks,
  onChange,
}: {
  campaignId: string;
  blocks: BodyBlock[];
  onChange: (next: BodyBlock[]) => void;
}) {
  const remove = (i: number) =>
    onChange(blocks.filter((_, idx) => idx !== i));
  const patchBlock = (i: number, partial: Partial<BodyBlock>) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...partial } : b)));
  const replaceBlock = (i: number, next: BodyBlock) =>
    onChange(blocks.map((b, idx) => (idx === i ? next : b)));
  const add = () =>
    onChange([...blocks, { title: null, description: null, cta: null }]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Stable per-position ids. Reorder swaps blocks beneath the same ids,
  // so transient per-card state (e.g. an in-flight regenerate) sticks to
  // the slot rather than the block — acceptable for v1; the only stateful
  // affordance is regenerate, and dragging mid-regenerate is unlikely.
  const ids = useMemo(
    () => blocks.map((_, i) => `block-${i}`),
    [blocks.length],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(blocks, from, to));
  };

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <FieldLabel>Sections</FieldLabel>
        <span className="text-xs text-ink-3">
          {blocks.length} block{blocks.length === 1 ? "" : "s"} · drag to reorder
        </span>
      </header>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {blocks.map((block, i) => (
              <SortableBlockCard
                key={ids[i]}
                id={ids[i]}
                campaignId={campaignId}
                index={i}
                blocks={blocks}
                block={block}
                onRemove={() => remove(i)}
                onPatch={(partial) => patchBlock(i, partial)}
                onReplace={(next) => replaceBlock(i, next)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
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

function SortableBlockCard({
  id,
  campaignId,
  index,
  blocks,
  block,
  onRemove,
  onPatch,
  onReplace,
}: {
  id: string;
  campaignId: string;
  index: number;
  blocks: BodyBlock[];
  block: BodyBlock;
  onRemove: () => void;
  onPatch: (partial: Partial<BodyBlock>) => void;
  onReplace: (next: BodyBlock) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <BlockCard
        campaignId={campaignId}
        index={index}
        blocks={blocks}
        block={block}
        onRemove={onRemove}
        onPatch={onPatch}
        onReplace={onReplace}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </li>
  );
}

function BlockCard({
  campaignId,
  index,
  blocks,
  block,
  onRemove,
  onPatch,
  onReplace,
  dragHandleProps,
  isDragging,
}: {
  campaignId: string;
  index: number;
  blocks: BodyBlock[];
  block: BodyBlock;
  onRemove: () => void;
  onPatch: (partial: Partial<BodyBlock>) => void;
  onReplace: (next: BodyBlock) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}) {
  const [isRegenerating, setRegenerating] = useState(false);

  const regenerate = async () => {
    if (isRegenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/regenerate-block`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index, blocks }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Regenerate failed");
      }
      const data = (await res.json()) as { block: BodyBlock };
      onReplace({ ...data.block, cta_href: block.cta_href ?? null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Regenerate failed";
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <article
      className={cn(
        "rounded-md border border-border bg-surface p-4 transition-shadow",
        isDragging && "shadow-lg",
      )}
    >
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Drag block ${index + 1}`}
          className="mt-0.5 inline-flex cursor-grab touch-none rounded p-1 text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-3 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <p className="grow text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          Block {index + 1}
        </p>
        <button
          type="button"
          onClick={() => void regenerate()}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1 text-xs text-brand transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="size-3" aria-hidden />
          {isRegenerating ? "Regenerating…" : "Regenerate"}
        </button>
        <div className="flex items-center gap-0.5 text-ink-3">
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
          <span className="w-10 text-xs font-medium uppercase tracking-wide text-ink-3">
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
        <div className="flex items-baseline gap-2">
          <span className="w-10 text-xs font-medium uppercase tracking-wide text-ink-3">
            Link
          </span>
          <input
            type="url"
            value={block.cta_href ?? ""}
            onChange={(e) => onPatch({ cta_href: emptyToNull(e.target.value) })}
            placeholder="https://… (optional)"
            className="grow bg-transparent font-mono text-xs text-ink-2 outline-none placeholder:text-ink-4"
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

// ─── Free top text (banner above hero) ───

function FreeTopTextSection({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <section className="space-y-2">
      <FieldLabel>Free top text</FieldLabel>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(emptyToNull(e.target.value))}
        placeholder="Optional banner above the hero"
        className={inputClass}
      />
    </section>
  );
}

// ─── SMS companion ───

function SmsSection({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  // Rendered length, not literal — `{link}` substitutes to a Klaviyo
  // short URL up to 24 chars at send time. We show the recipient-side
  // count so it matches the wire cap.
  const rendered = smsRenderedLength(value);
  const over = rendered > SMS_HARD_CAP;
  return (
    <section className="space-y-2">
      <header className="flex items-baseline justify-between">
        <FieldLabel>SMS</FieldLabel>
        <span
          className={cn(
            "text-xs tabular-nums",
            over ? "text-destructive" : "text-ink-3",
          )}
        >
          {rendered} / {SMS_HARD_CAP}
        </span>
      </header>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(emptyToNull(e.target.value))}
        rows={2}
        placeholder="Use {link} as the URL placeholder"
        className={cn(inputClass, "resize-none")}
      />
    </section>
  );
}

// ─── Nicky quote (brand-guide §7) ───

function NickyQuoteSection({
  value,
  onChange,
}: {
  value: ApprovedCopy["nicky_quote"];
  onChange: (next: ApprovedCopy["nicky_quote"]) => void;
}) {
  return (
    <section className="space-y-2">
      <FieldLabel>Nicky quote</FieldLabel>
      <textarea
        value={value?.quote ?? ""}
        onChange={(e) => {
          const quote = e.target.value;
          onChange(
            quote.trim().length
              ? { quote, response: value?.response ?? null }
              : null,
          );
        }}
        rows={2}
        placeholder="Brand-guide §7 — clear to omit"
        className={cn(inputClass, "resize-none")}
      />
      <input
        type="text"
        value={value?.response ?? ""}
        disabled={!value}
        onChange={(e) =>
          onChange(
            value
              ? { ...value, response: emptyToNull(e.target.value) }
              : null,
          )
        }
        placeholder='e.g. "Thank you Nicky!"'
        className={cn(inputClass, "disabled:opacity-50")}
      />
    </section>
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
