# Step 5 — Design screen

**Status:** spec  
**Date:** 2026-04-29  
**Branch:** `spring-flat` (continuation, see Workflow)

## Goal

Implement Step 5 ("Design") of the v1 campaign-creation wizard: a three-column editor (layers · canvas · properties) where the operator clicks any block in the rendered email to edit text, image, or background. This is the most complex screen in the wizard, and the brief asks for it to be built second so the patterns it establishes feed Step 2 (Copy) and Step 3 (Layout) later.

The existing status-based flow at `/campaigns/[id]` is left untouched. Step 5 lives at a new sibling route, `/campaigns/[id]/design`, that the existing `WizardProgress` component already links to.

## Non-goals

- Drag-to-reorder blocks in the layers panel — handle is rendered but inactive in v1.
- "+ Add section" — placeholder button, toast on click.
- AI suggestion card content — static placeholder, no LLM call.
- "Send for approval" CTA — explicitly excluded by the user.
- "Send test" — toast-only stub, matches the existing "Klaviyo API push deferred" decision.
- Wizard-wide auto-save debounce hook — that belongs to the shared chrome / route scaffold phase, not Step 5.
- Steps 2–4 of the wizard.

## User flow

1. Operator lands at `/campaigns/[id]/design` having completed asset upload + final render in an earlier step (or via the existing status flow). Campaign has `chosenSkeletonId`, `approvedCopy`, `approvedProducts`, and `renderResult`.
2. Three columns: layers (left), canvas (center), properties (right). The canvas shows the rendered email with `editable: true` so each editable element carries `data-edit-target` and a hover outline.
3. Operator clicks a block in the canvas — the iframe posts `{ type: "theograce:edit", target, rect }` to the parent. The parent decodes the target, finds the matching skeleton block, and updates `selected` state.
4. Layers panel highlights that block. Properties panel shows the editable fields for the block (text, image, background). An overlay rect on top of the iframe shows a 2 px brand-colored selection outline at the clicked rect.
5. Operator edits a field → save → fine-tune endpoint hits → `router.refresh()` → server re-renders editable HTML → iframe updates. Saved indicator in the action bar flips green.
6. Operator can also click a block in the layers panel to switch the properties panel without first clicking in the canvas (no selection rect until they click in the canvas).

## Architecture

### Route

`src/app/campaigns/[id]/design/page.tsx` — new server component.

```ts
export const dynamic = "force-dynamic";

export default async function DesignPage({ params }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  // Step 5 is the post-render polish step. If the campaign isn't far
  // enough along, send the operator back to the existing detail view —
  // it knows how to render every other status.
  if (
    !campaign.chosenSkeletonId ||
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.renderResult
  ) {
    redirect(`/campaigns/${id}`);
  }

  const editableHtml = await renderEditableForCampaign(campaign);
  if (!editableHtml) redirect(`/campaigns/${id}`);

  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) redirect(`/campaigns/${id}`);

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Design`}
        currentStep={5}
        campaignId={campaign.id}
      />
      <DesignStepView
        campaign={campaign}
        skeleton={skeleton}
        editableHtml={editableHtml}
      />
    </>
  );
}
```

### Component tree

```
DesignPage (server)
└── DesignStepView (client) — three-column shell + state owner
    ├── LayersPanel — left, 180px sticky
    ├── DesignCanvas — center, scrolls
    │   └── iframe (srcDoc=editableHtml) + selection-outline overlay
    ├── PropertiesPanel — right, 240px sticky
    └── DesignActionBar — sticky bottom
```

### State

Lives entirely in `DesignStepView`. No global store, no URL state.

```ts
interface SelectedBlock {
  /** Index into skeleton.blocks. */
  index: number;
  /** Last clicked editable target, e.g. "text:body_blocks[0].title".
   *  Null when the selection came from the layers panel rather than a
   *  canvas click. */
  target: string | null;
  /** Iframe-relative rect of the last clicked element, used to position
   *  the selection overlay. Null when target is null. */
  rect: { x: number; y: number; w: number; h: number } | null;
}

const [selected, setSelected] = useState<SelectedBlock | null>(null);
const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("saved");
```

### Iframe ↔ parent communication (Option A)

The renderer's existing inline `EDIT_CLICK_SCRIPT` already posts `{ type: "theograce:edit", target, rect }` on every click, and `EDIT_HIGHLIGHT_CSS` already paints a hover outline. Step 5 reuses both verbatim — no renderer changes.

The parent listens for the postMessage in `DesignCanvas` and forwards `(target, rect)` up to `DesignStepView`, which:

1. Calls `targetToBlockIndex(skeleton, target)` to find the matching skeleton block.
2. Updates `selected` with the index, target, and rect.
3. The `LayersPanel` re-renders with the matching row highlighted.
4. The `PropertiesPanel` re-renders against the new block.

**Selection outline:** an absolute-positioned `<div>` inside `DesignCanvas`, positioned over the iframe at `selected.rect`, with `outline: 2px solid var(--brand)` and `outline-offset: 2px`. Hidden when `selected.rect` is null.

The existing renderer hover outline (`#76A4C4` blue) stays — distinct from the active-selection outline (brand). Both can be visible at once briefly while the operator hovers over a different block.

## Modules

### `block-properties.ts` (new util)

```ts
export type PropField =
  | { kind: "text"; label: string; path: string; multiline: boolean }
  | { kind: "image:asset"; label: string; slotKey: string }
  | { kind: "bg"; label: string; blockIndex: number };

export const BLOCK_TYPE_LABELS: Record<BlockType, string>;

/** Maps a click target back to the skeleton block that owns it.
 *  Returns null only for unrecognised targets (defensive). */
export function targetToBlockIndex(
  skeleton: SkeletonManifest,
  target: string,
): number | null;

/** Lists the editable fields for a single block. Walks block.bind, maps
 *  each ContentPath through the same pathToEditTarget logic the renderer
 *  uses, and adds a final bg field (always editable per renderer). */
export function resolveBlockProperties(
  skeleton: SkeletonManifest,
  blockIndex: number,
): PropField[];
```

Mapping rules for `targetToBlockIndex`:

- `bg:block:N` → `N` directly.
- `text:<path>` → first skeleton block where any string bind value equals `<path>` exactly. (Avoids substring matching: `body_blocks[0].title` and `body_blocks[10].title` shouldn't collide.)
- `image:asset:<key>` → first skeleton block with a bind value equal to `"assets.<key>"`.
- Unrecognised target → `null`. The caller (`DesignStepView`) leaves `selected` unchanged in that case rather than throwing.

`BLOCK_TYPE_LABELS` collapses block-type families to friendly names: every `hero_*` → "Hero", every `product_grid_*` → "Product grid", `logo_header` → "Logo bar", `announcement_bar` → "Announcement", `text_block_centered` → "Text", `editorial_split` → "Editorial", `nicky_quote_module` → "Nicky quote", `cta_button` → "CTA", `section_label` → "Section label", `closing_block` → "Closing", `footer` → "Footer".

Friendly labels for prop names inside `resolveBlockProperties` are produced by a `propLabel(propName)` helper. Known prop names map to brand-aware labels: `headline`/`title` → "Headline", `body`/`description` → "Body", `subLabel` → "Sub-label", `cta`/`ctaLabel` → "CTA label", `imageUrl`/`portraitUrl` → "Image", `quote` → "Quote", `response` → "Response", `text` → "Text". Unknown prop names fall back to a Title-Cased version of the prop name (so a future block with a new prop still renders something legible).

### `edit-fields/` (extracted)

The existing `edit-popover.tsx` contains three editor components — `TextEditor`, `ImageEditor`, `BackgroundEditor` — plus their `readPath` / `writePath` / `shortError` helpers. Extract them to:

- `src/modules/campaigns/components/edit-fields/text-editor.tsx`
- `src/modules/campaigns/components/edit-fields/image-editor.tsx`
- `src/modules/campaigns/components/edit-fields/background-editor.tsx`
- `src/modules/campaigns/components/edit-fields/path-helpers.ts` (readPath, writePath, stripCampaignId)
- `src/modules/campaigns/components/edit-fields/short-error.ts`

`edit-popover.tsx` is rewritten to import these. No behavior change to the existing completed-view popover. Both `EditPopover` and `PropertiesPanel` consume the same field components.

### `design-step/` (new components)

**`design-step-view.tsx`** — owns `selected` and `savingState`. Wires the three panels. Provides `onSaving`/`onSaved` callbacks to the properties panel: `onSaving` flips `savingState` to `"saving"` (called by the field component just before fetch); `onSaved` calls `router.refresh()` and flips `savingState` to `"saved"` (called after the field component's fetch resolves).

**`layers-panel.tsx`** — sticky 180px column. Header "SECTIONS" (`text-ink-3 uppercase tracking-wider text-[11px]`). Renders a row per block from `skeleton.blocks`. Row contents: drag handle icon (visual only, `opacity-50`), block label from `BLOCK_TYPE_LABELS`. Selected row uses `bg-brand-soft text-brand font-semibold`. Footer: `+ Add section` button (`text-brand`, toast "Coming soon" on click).

**`design-canvas.tsx`** — flex-1 column with `bg-surface-2` page tint. Inner wrapper centers a ~360 px wide email card on a soft drop shadow. iframe uses the `srcDoc={editableHtml}` + `body.scrollHeight` auto-size pattern from `EditableEmailFrame`. A `useEffect` listens for `theograce:edit` postMessages and forwards them to the parent's `onBlockSelect` callback. An absolute-positioned overlay `<div>` renders on top of the iframe at `selected.rect` with the brand-colored selection outline.

**`properties-panel.tsx`** — sticky 240px right column. Reads `selected.index` → `resolveBlockProperties(skeleton, index)` → `PropField[]`. Header: "SELECTED" (uppercase ink-3) + block label. For each `PropField`, render the matching field component from `edit-fields/`. Each field's `onSaved` callback flips `savingState` via a parent prop. Below the field list: static AI suggestion card (`bg-brand-soft`, `✦` prefix, "Suggestions coming soon"). When `selected` is null, the panel shows an empty state ("Click a block to edit").

**`design-action-bar.tsx`** — sticky bottom bar. Layout: `← Back` ghost (`href={/campaigns/${id}/images}`) on left · saving indicator pill in center (saved: small green dot + "Saved · auto" in `text-ink-3`; saving: small amber dot + "Saving…" in `text-ink-3`; dot uses `bg-success` / `bg-warning` tokens) · `Send test` ghost (toast stub) + `Preview` outlined (`href={/campaigns/${id}/preview/${variantSlug(skeletonId)}}`, `target=_blank`) on right. The `variantSlug` helper already exists in `completed-view.tsx` — extract it to `src/modules/campaigns/utils/variant-slug.ts` so both consumers can import it.

### Untouched

- `src/modules/email-templates/**` — no renderer changes.
- `src/modules/campaigns/components/editable-email-frame.tsx`, `edit-popover.tsx` (logic), `completed-view.tsx`, all status-flow view components.
- All server actions, route handlers, fine-tune endpoints.
- `WizardChrome` and `WizardProgress` (used as-is).

## Save loop

The three existing fine-tune endpoints already do everything the panel needs:

| Field type | Endpoint | Body |
|---|---|---|
| `text` | `POST /api/campaigns/[id]/fine-tune/copy` | `{ approvedCopy }` |
| `image:asset` | `POST /api/campaigns/[id]/fine-tune/asset` | multipart with `slotKey` + `file` |
| `bg` | `POST /api/campaigns/[id]/fine-tune/block-bg` | `{ blockIndex, background }` |

Each field component in `edit-fields/` already exposes an `onSaved` callback that fires on a 2xx response. To surface the saving state to the action bar, the field components also accept a new optional `onSaving` callback that fires once just before the fetch starts. Sequence:

1. User edits a field, clicks save.
2. Field component calls `onSaving?.()` → `DesignStepView` sets `savingState = "saving"`.
3. Field component runs the fetch.
4. On 2xx: field calls `onSaved()` → `DesignStepView` sets `savingState = "saved"` and calls `router.refresh()`.
5. `router.refresh()` triggers a fresh RSC payload that includes the updated `editableHtml`; the iframe `srcDoc` changes and the canvas re-renders. The selection overlay rect goes stale at the same moment — `DesignStepView` clears `selected.rect` (but keeps `selected.index`) when `editableHtml` changes, so the overlay disappears until the next click.

`router.refresh()` is fire-and-forget in Next.js App Router (no Promise to await). The "saving" indicator is therefore visible only for the duration of the fetch — typically ~100–500 ms. The brief explicitly wants the saved indicator visible most of the time, so this matches the intent.

`EditPopover` doesn't use the new `onSaving` callback; passing it as optional keeps that consumer unchanged.

## Visual details (from brief, with codebase notes)

- **Canvas page tint:** `bg-surface-2` (matches brief's `#ede9e1`-adjacent — codebase uses `#f5f2ec`, close enough).
- **Selection outline:** `outline: 2px solid var(--brand); outline-offset: 2px;` — `--brand` in this codebase is `#7e3a52` (wine), the brief calls for terracotta `#c96442`. We use the codebase token to stay consistent with the rest of the app's brand color, including the existing `WizardProgress` step circle.
- **AI affordance text:** `text-brand` text + `✦` prefix, never a button — applies to "+ Add section" and the AI suggestion card.
- **Saved indicator colors:** green dot uses `bg-success` (codebase `--green: #4a7c59`), amber uses `bg-warning` (`--amber: #b88636`).
- **Type:** display serif (Instrument Serif) for headlines inside textarea fields where the brief calls it out (Headline field in properties panel uses `font-display` class). Other UI in Inter (default).
- **Spacing:** Tailwind v4 default scale (4 / 8 / 12 / 16 / 20 / 24) — already aligned with brief.

## Accessibility

- Layers panel rows are `<button>` with `aria-pressed={selected?.index === i}`.
- Properties panel field labels are real `<label>` tags, focus-visible styled by global `:focus-visible` ring.
- Selection outline overlay has `aria-hidden` (it's purely visual; the actual selection state is on the panel buttons).
- The iframe has a descriptive `title` attribute (`design-${campaign.id}`) so screen readers can identify it.

## Tests

Vitest unit tests for the new util:

- `block-properties.test.ts` — covers `targetToBlockIndex` (every target form, including unmappable `text:sms`), `resolveBlockProperties` (each block type yields the expected fields), and `BLOCK_TYPE_LABELS` shape (every BlockType has a label).

No component tests for v1 — the brief's implementation order says to ship Step 5 second so the patterns can feed later steps. Component tests come with the broader wizard test pass.

Existing `edit-popover.test.ts` (if any — there isn't one today) is unaffected; the extracted field components are imported back into the unchanged `EditPopover`. The `update-block-background.ts` and `update-copy.ts` action tests are untouched.

## Verification

Before marking this complete:

1. `npm run typecheck` clean.
2. `npm run test:run` clean.
3. `npm run build` clean.
4. Manual: navigate to a completed campaign in the dev DB, visit `/campaigns/<id>/design`, click each block type, edit a text field, edit an image, change a background, verify saved indicator flips, verify preview button opens the right URL, verify back button returns to images step (which 404s today — that's expected, the back link target route is owned by Step 4 work).

## Workflow

This work continues the existing `spring-flat` branch (current branch at session start). No new branch — Step 5 is one of several UI follow-ups stacked on this branch per the user's preference for bundled UI PRs. Commit the spec doc first, then implementation in a small number of focused commits (extract → new util → new components → new route → tests).
