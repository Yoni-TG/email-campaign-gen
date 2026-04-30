# Step 5 — Design Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the wizard's Step 5 ("Design") — a three-column editor at `/campaigns/[id]/design` that lets the operator click any block in the rendered email and edit text/image/background through a side panel.

**Architecture:** New route consuming the existing editable-HTML pipeline. A small extraction of the existing `EditPopover` editors into reusable `edit-fields/` so both the popover and the new properties panel share them. Iframe-only selection (Option A): the renderer's `theograce:edit` postMessages drive panel state; no renderer changes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, sonner, lucide-react, Vitest. Existing `react-email`-rendered editable HTML pipeline.

**Spec:** `docs/superpowers/specs/2026-04-29-step-5-design-screen-design.md`

---

## File Structure

**New (9):**
- `src/app/campaigns/[id]/design/page.tsx` — server route + guard
- `src/modules/campaigns/components/design-step/design-step-view.tsx` — client orchestrator (state owner)
- `src/modules/campaigns/components/design-step/layers-panel.tsx`
- `src/modules/campaigns/components/design-step/design-canvas.tsx`
- `src/modules/campaigns/components/design-step/properties-panel.tsx`
- `src/modules/campaigns/components/design-step/design-action-bar.tsx`
- `src/modules/campaigns/utils/block-properties.ts`
- `src/modules/campaigns/utils/block-properties.test.ts`
- `src/modules/campaigns/utils/variant-slug.ts`

**Extract (refactor — no behavior change):**
- `src/modules/campaigns/components/edit-fields/path-helpers.ts`
- `src/modules/campaigns/components/edit-fields/short-error.ts`
- `src/modules/campaigns/components/edit-fields/text-editor.tsx`
- `src/modules/campaigns/components/edit-fields/image-editor.tsx`
- `src/modules/campaigns/components/edit-fields/background-editor.tsx`

**Modify:**
- `src/modules/campaigns/components/edit-popover.tsx` — re-import editors from `edit-fields/`
- `src/modules/campaigns/components/completed-view.tsx` — re-import `variantSlug` from new helper

---

## Task 1: Extract `path-helpers.ts` and `short-error.ts`

**Files:**
- Create: `src/modules/campaigns/components/edit-fields/path-helpers.ts`
- Create: `src/modules/campaigns/components/edit-fields/short-error.ts`
- Modify: `src/modules/campaigns/components/edit-popover.tsx` (remove the helpers, import from new locations)

This is a pure refactor. No tests are added for these helpers (already exercised through `EditPopover`); we verify nothing broke by running `typecheck` + `build`.

- [ ] **Step 1: Create `path-helpers.ts`**

Create file with the exact contents below. (Code copied verbatim from the bottom of `edit-popover.tsx` so behavior stays identical.)

```ts
// src/modules/campaigns/components/edit-fields/path-helpers.ts
import type { ApprovedCopy } from "@/lib/types";

// approvedCopy paths follow the same dotted/array language as the
// renderer's bind paths: subject_variant.subject, body_blocks[0].title,
// nicky_quote.quote, etc. These helpers walk the JSON shape and produce
// a new copy with one field patched.

export type Path =
  | "subject_variant.subject"
  | "subject_variant.preheader"
  | "free_top_text"
  | "sms"
  | "nicky_quote.quote"
  | "nicky_quote.response"
  | string;

export function readPath(copy: ApprovedCopy | null, path: Path): string | null {
  if (!copy) return null;
  if (path === "subject_variant.subject") return copy.subject_variant.subject;
  if (path === "subject_variant.preheader") return copy.subject_variant.preheader;
  if (path === "free_top_text") return copy.free_top_text;
  if (path === "sms") return copy.sms;
  if (path === "nicky_quote.quote") return copy.nicky_quote?.quote ?? null;
  if (path === "nicky_quote.response") return copy.nicky_quote?.response ?? null;
  const m = path.match(/^body_blocks\[(\d+)\]\.(title|description|cta)$/);
  if (m) {
    const i = parseInt(m[1], 10);
    const field = m[2] as "title" | "description" | "cta";
    return copy.body_blocks[i]?.[field] ?? null;
  }
  return null;
}

export function writePath(
  copy: ApprovedCopy,
  path: Path,
  value: string | null,
): ApprovedCopy {
  const v = value ?? null;
  if (path === "subject_variant.subject") {
    return {
      ...copy,
      subject_variant: { ...copy.subject_variant, subject: v ?? "" },
    };
  }
  if (path === "subject_variant.preheader") {
    return {
      ...copy,
      subject_variant: { ...copy.subject_variant, preheader: v ?? "" },
    };
  }
  if (path === "free_top_text") return { ...copy, free_top_text: v };
  if (path === "sms") return { ...copy, sms: v };
  if (path === "nicky_quote.quote") {
    if (!v) return { ...copy, nicky_quote: null };
    return {
      ...copy,
      nicky_quote: { quote: v, response: copy.nicky_quote?.response ?? null },
    };
  }
  if (path === "nicky_quote.response") {
    if (!copy.nicky_quote) return copy;
    return {
      ...copy,
      nicky_quote: { ...copy.nicky_quote, response: v },
    };
  }
  const m = path.match(/^body_blocks\[(\d+)\]\.(title|description|cta)$/);
  if (m) {
    const i = parseInt(m[1], 10);
    const field = m[2] as "title" | "description" | "cta";
    return {
      ...copy,
      body_blocks: copy.body_blocks.map((b, idx) =>
        idx === i ? { ...b, [field]: v } : b,
      ),
    };
  }
  return copy;
}

export function stripCampaignId(
  copy: ApprovedCopy,
): Omit<ApprovedCopy, "campaign_id"> {
  const { campaign_id: _ignored, ...rest } = copy;
  void _ignored;
  return rest;
}

// Heuristic: paths whose value is typically a sentence or paragraph want
// a textarea; short labels like subject / preheader / cta want a single-
// line input that submits on Enter.
export function pathIsMultiline(path: string): boolean {
  return (
    path.endsWith(".description") ||
    path === "nicky_quote.quote" ||
    path === "sms"
  );
}
```

- [ ] **Step 2: Create `short-error.ts`**

```ts
// src/modules/campaigns/components/edit-fields/short-error.ts

// Server errors can be huge (Prisma stack traces ramble). Clip to one
// line so the toast doesn't dominate the screen — the full payload is
// still visible in the network tab if the operator needs to forward it.
export function shortError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : fallback;
  const firstLine = raw.split("\n")[0] ?? raw;
  if (firstLine.length <= 140) return firstLine;
  return firstLine.slice(0, 140) + "…";
}
```

- [ ] **Step 3: Update `edit-popover.tsx` to import the helpers**

In `src/modules/campaigns/components/edit-popover.tsx`:

1. Add imports near the top of the file (after the existing imports, before any function defs):

```ts
import {
  readPath,
  writePath,
  stripCampaignId,
  pathIsMultiline,
} from "./edit-fields/path-helpers";
import { shortError } from "./edit-fields/short-error";
```

2. Delete these blocks from the bottom of the file (everything inside, including comments):
   - The `Path` type alias and the `readPath` / `writePath` / `stripCampaignId` functions
   - The `pathIsMultiline` function
   - The `shortError` function

The helpers are now imported from `edit-fields/`. Behavior is unchanged.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: clean (no errors).

- [ ] **Step 5: Commit**

```bash
git add src/modules/campaigns/components/edit-fields/path-helpers.ts \
        src/modules/campaigns/components/edit-fields/short-error.ts \
        src/modules/campaigns/components/edit-popover.tsx
git commit -m "$(cat <<'EOF'
refactor(edit-fields): extract path helpers and shortError from edit-popover

Pure extraction. No behavior change. Sets up shared helpers for the
upcoming Step 5 properties panel.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Extract `text-editor.tsx`, `image-editor.tsx`, `background-editor.tsx`

**Files:**
- Create: `src/modules/campaigns/components/edit-fields/text-editor.tsx`
- Create: `src/modules/campaigns/components/edit-fields/image-editor.tsx`
- Create: `src/modules/campaigns/components/edit-fields/background-editor.tsx`
- Modify: `src/modules/campaigns/components/edit-popover.tsx` (remove component bodies, import the new components)

Each new component is the existing one with one tiny addition: an optional `onSaving?: () => void` callback that fires once just before the fetch starts. `EditPopover` doesn't pass it — `PropertiesPanel` will (in a later task).

- [ ] **Step 1: Create `text-editor.tsx`**

```tsx
// src/modules/campaigns/components/edit-fields/text-editor.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Campaign } from "@/lib/types";
import {
  readPath,
  writePath,
  stripCampaignId,
  pathIsMultiline,
} from "./path-helpers";
import { shortError } from "./short-error";

interface Props {
  path: string;
  campaign: Campaign;
  /** Override the path-based multiline heuristic when the caller knows
   *  which form factor it wants. */
  multiline?: boolean;
  /** Fired once before the fetch starts. Optional. */
  onSaving?: () => void;
  onSaved: () => void;
}

export function TextEditor({
  path,
  campaign,
  multiline,
  onSaving,
  onSaved,
}: Props) {
  const initial = readPath(campaign.approvedCopy, path) ?? "";
  const isMultiline = multiline ?? pathIsMultiline(path);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!campaign.approvedCopy) return;
    onSaving?.();
    setBusy(true);
    try {
      const next = writePath(campaign.approvedCopy, path, value.trim() || null);
      const res = await fetch(`/api/campaigns/${campaign.id}/fine-tune/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedCopy: stripCampaignId(next) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Copy updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 font-mono text-xs text-muted-foreground">{path}</p>
      {isMultiline ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="text-sm"
        />
      ) : (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
        />
      )}
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save & Re-render"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `image-editor.tsx`**

```tsx
// src/modules/campaigns/components/edit-fields/image-editor.tsx
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shortError } from "./short-error";

interface Props {
  title: string;
  endpoint: string;
  formData: Record<string, string>;
  onSaving?: () => void;
  onSaved: () => void;
}

export function ImageEditor({
  title,
  endpoint,
  formData,
  onSaving,
  onSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    onSaving?.();
    setBusy(true);
    try {
      const body = new FormData();
      for (const [k, v] of Object.entries(formData)) body.append(k, v);
      body.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      toast.success("Image replaced — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 font-mono text-xs text-muted-foreground">{title}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : "Choose new image"}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground">
        JPG, PNG, or WebP. Re-renders on upload.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `background-editor.tsx`**

```tsx
// src/modules/campaigns/components/edit-fields/background-editor.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { shortError } from "./short-error";

const BG_OPTIONS: Array<{ key: string; label: string; swatch: string }> = [
  { key: "white", label: "White", swatch: "#FFFFFF" },
  { key: "baby_blue", label: "Baby Blue", swatch: "#BEDFF7" },
  { key: "pale_blue", label: "Pale Blue", swatch: "#E6F0F8" },
  { key: "mid_blue", label: "Mid Blue", swatch: "#76A4C4" },
];

interface Props {
  campaignId: string;
  blockIndex: number;
  currentBackground: string | null;
  onSaving?: () => void;
  onSaved: () => void;
}

export function BackgroundEditor({
  campaignId,
  blockIndex,
  currentBackground,
  onSaving,
  onSaved,
}: Props) {
  const [busy, setBusy] = useState(false);

  const save = async (background: string) => {
    onSaving?.();
    setBusy(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/block-bg`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockIndex, background }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Background updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 font-mono text-xs text-muted-foreground">
        background · block {blockIndex}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BG_OPTIONS.map((opt) => {
          const active = currentBackground === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={busy}
              onClick={() => save(opt.key)}
              className={`flex items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors ${
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span
                className="size-6 shrink-0 rounded border border-border/60"
                style={{ backgroundColor: opt.swatch }}
                aria-hidden
              />
              <span className="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Click a swatch to apply and re-render.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Update `edit-popover.tsx` to import the editors**

In `src/modules/campaigns/components/edit-popover.tsx`:

1. Add imports near the existing imports:

```ts
import { TextEditor } from "./edit-fields/text-editor";
import { ImageEditor } from "./edit-fields/image-editor";
import { BackgroundEditor } from "./edit-fields/background-editor";
```

2. Delete the three internal function definitions: `ImageEditor`, `TextEditor`, `BackgroundEditor` and the `BG_OPTIONS` constant (now lives in `background-editor.tsx`). Keep all other code (the `EditPopover` component itself, the dispatch logic, `Rect` type, etc.).

After this edit, `edit-popover.tsx` should be roughly:
- Imports
- `Rect` interface, `Props` interface, `EditPopover` function
- Nothing else — the three child components are gone, replaced by imports.

The file should be well under 150 lines now (was ~480).

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: clean.

Run: `npm run test:run`
Expected: all existing tests still pass (no behavioral change).

- [ ] **Step 6: Commit**

```bash
git add src/modules/campaigns/components/edit-fields/text-editor.tsx \
        src/modules/campaigns/components/edit-fields/image-editor.tsx \
        src/modules/campaigns/components/edit-fields/background-editor.tsx \
        src/modules/campaigns/components/edit-popover.tsx
git commit -m "$(cat <<'EOF'
refactor(edit-fields): extract editors into reusable field components

TextEditor, ImageEditor, BackgroundEditor become standalone components
under edit-fields/, each gaining an optional onSaving callback the new
Step 5 properties panel will use to surface saving state. EditPopover
behaviour is unchanged.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Extract `variant-slug.ts`

**Files:**
- Create: `src/modules/campaigns/utils/variant-slug.ts`
- Modify: `src/modules/campaigns/components/completed-view.tsx` (remove local `variantSlug`, import from new helper)

- [ ] **Step 1: Create `variant-slug.ts`**

```ts
// src/modules/campaigns/utils/variant-slug.ts

// URL-safe form of a skeleton id (which contains a `/` for the
// campaign-type folder). Used by the /campaigns/<id>/preview/<slug>
// route and any UI that links to it.
export function variantSlug(skeletonId: string): string {
  return skeletonId.replace(/\//g, "__");
}
```

- [ ] **Step 2: Update `completed-view.tsx`**

In `src/modules/campaigns/components/completed-view.tsx`:

1. Remove the local function:

```ts
function variantSlug(skeletonId: string): string {
  return skeletonId.replace(/\//g, "__");
}
```

2. Add an import alongside the existing imports:

```ts
import { variantSlug } from "@/modules/campaigns/utils/variant-slug";
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/modules/campaigns/utils/variant-slug.ts \
        src/modules/campaigns/components/completed-view.tsx
git commit -m "$(cat <<'EOF'
refactor(campaigns): extract variantSlug helper

Pulls the slug helper out of completed-view.tsx so the upcoming Step 5
action bar can link to /preview/<slug> without duplicating it.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create `block-properties.ts` util + tests

**Files:**
- Create: `src/modules/campaigns/utils/block-properties.ts`
- Create: `src/modules/campaigns/utils/block-properties.test.ts`

This util powers the LayersPanel and PropertiesPanel. TDD: write tests first, run to fail, implement, run to pass.

- [ ] **Step 1: Write the failing test file**

```ts
// src/modules/campaigns/utils/block-properties.test.ts
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "@/modules/email-templates/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import {
  BLOCK_TYPE_LABELS,
  propLabel,
  resolveBlockProperties,
  targetToBlockIndex,
} from "./block-properties";

const SAMPLE_SKELETON: SkeletonManifest = {
  id: "test/sample",
  name: "Sample",
  campaignTypes: ["holiday_seasonal"],
  tags: [],
  description: "",
  requiredAssets: [
    { key: "hero", label: "Hero", required: true },
  ],
  blocks: [
    { type: "logo_header", bind: {} },
    { type: "announcement_bar", bind: { text: "free_top_text" } },
    {
      type: "hero_lifestyle",
      bind: {
        imageUrl: "assets.hero",
        subLabel: "literal:WITH LOVE",
        headline: "body_blocks[0].title",
        body: "body_blocks[0].description",
      },
    },
    {
      type: "product_grid_3x2",
      bind: { products: "products" },
    },
    {
      type: "closing_block",
      bind: {
        headline: "body_blocks[1].title",
        body: "body_blocks[1].description",
        ctaLabel: "body_blocks[1].cta",
        ctaHref: "literal:#",
      },
    },
    { type: "footer", bind: {} },
  ],
};

describe("BLOCK_TYPE_LABELS", () => {
  it("has a label for every BlockType", () => {
    for (const type of BLOCK_TYPES) {
      expect(BLOCK_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe("propLabel", () => {
  it("maps known prop names to friendly labels", () => {
    expect(propLabel("headline")).toBe("Headline");
    expect(propLabel("title")).toBe("Headline");
    expect(propLabel("body")).toBe("Body");
    expect(propLabel("description")).toBe("Body");
    expect(propLabel("ctaLabel")).toBe("CTA label");
    expect(propLabel("imageUrl")).toBe("Image");
    expect(propLabel("portraitUrl")).toBe("Image");
    expect(propLabel("subLabel")).toBe("Sub-label");
  });

  it("Title-cases unknown camelCase prop names", () => {
    expect(propLabel("badgeText")).toBe("Badge Text");
    expect(propLabel("foo")).toBe("Foo");
  });
});

describe("targetToBlockIndex", () => {
  it("maps bg:block:N to N", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "bg:block:0")).toBe(0);
    expect(targetToBlockIndex(SAMPLE_SKELETON, "bg:block:5")).toBe(5);
  });

  it("maps text:body_blocks[0].title to the hero block", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[0].title"),
    ).toBe(2);
  });

  it("maps text:body_blocks[1].title to the closing block", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[1].title"),
    ).toBe(4);
  });

  it("maps text:free_top_text to the announcement bar", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "text:free_top_text")).toBe(1);
  });

  it("maps image:asset:hero to the hero block", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "image:asset:hero")).toBe(2);
  });

  it("returns null for an unknown target prefix", () => {
    expect(targetToBlockIndex(SAMPLE_SKELETON, "weird:thing")).toBeNull();
  });

  it("returns null for an unmappable text path", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "text:body_blocks[42].title"),
    ).toBeNull();
  });

  it("returns null for an unmappable asset key", () => {
    expect(
      targetToBlockIndex(SAMPLE_SKELETON, "image:asset:nonexistent"),
    ).toBeNull();
  });

  it("uses exact-equal matching, not substring", () => {
    // body_blocks[1] must NOT match body_blocks[10]
    const skeleton: SkeletonManifest = {
      ...SAMPLE_SKELETON,
      blocks: [{ type: "text_block_centered", bind: { headline: "body_blocks[10].title" } }],
    };
    expect(targetToBlockIndex(skeleton, "text:body_blocks[1].title")).toBeNull();
    expect(targetToBlockIndex(skeleton, "text:body_blocks[10].title")).toBe(0);
  });
});

describe("resolveBlockProperties", () => {
  it("returns text fields, image fields, and a bg field for a hero block", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 2);
    expect(fields).toEqual([
      expect.objectContaining({
        kind: "image:asset",
        propName: "imageUrl",
        slotKey: "hero",
      }),
      expect.objectContaining({
        kind: "text",
        propName: "headline",
        path: "body_blocks[0].title",
        multiline: false,
      }),
      expect.objectContaining({
        kind: "text",
        propName: "body",
        path: "body_blocks[0].description",
        multiline: true,
      }),
      expect.objectContaining({ kind: "bg", blockIndex: 2 }),
    ]);
  });

  it("skips literal: bindings", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 2);
    expect(fields.some((f) => f.kind === "text" && f.propName === "subLabel")).toBe(
      false,
    );
  });

  it("skips the products binding on a grid block but still appends bg", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 3);
    expect(fields).toEqual([
      expect.objectContaining({ kind: "bg", blockIndex: 3 }),
    ]);
  });

  it("returns just bg for a block with no editable bindings", () => {
    const fields = resolveBlockProperties(SAMPLE_SKELETON, 0);
    expect(fields).toEqual([
      expect.objectContaining({ kind: "bg", blockIndex: 0 }),
    ]);
  });

  it("returns [] for an out-of-range index", () => {
    expect(resolveBlockProperties(SAMPLE_SKELETON, 99)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/modules/campaigns/utils/block-properties.test.ts`
Expected: FAIL — module `./block-properties` not found.

- [ ] **Step 3: Implement `block-properties.ts`**

```ts
// src/modules/campaigns/utils/block-properties.ts
import type {
  BlockType,
  SkeletonManifest,
} from "@/modules/email-templates/types";

export type PropField =
  | {
      kind: "text";
      propName: string;
      label: string;
      path: string;
      multiline: boolean;
    }
  | {
      kind: "image:asset";
      propName: string;
      label: string;
      slotKey: string;
    }
  | { kind: "bg"; label: string; blockIndex: number };

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  logo_header: "Logo bar",
  announcement_bar: "Announcement",
  hero_lifestyle: "Hero",
  hero_framed: "Hero",
  hero_product: "Hero",
  hero_typography: "Hero",
  hero_tile_graphic: "Hero",
  text_block_centered: "Text",
  editorial_split: "Editorial",
  product_grid_2x2: "Product grid",
  product_grid_3x2: "Product grid",
  product_grid_4x1: "Product grid",
  product_grid_magazine: "Product grid",
  product_grid_split: "Product grid",
  product_grid_best_sellers: "Product grid",
  nicky_quote_module: "Nicky quote",
  cta_button: "CTA",
  section_label: "Section label",
  closing_block: "Closing",
  footer: "Footer",
};

const PROP_LABELS: Record<string, string> = {
  headline: "Headline",
  title: "Headline",
  body: "Body",
  description: "Body",
  subLabel: "Sub-label",
  cta: "CTA label",
  ctaLabel: "CTA label",
  imageUrl: "Image",
  portraitUrl: "Image",
  quote: "Quote",
  response: "Response",
  text: "Text",
};

export function propLabel(propName: string): string {
  if (PROP_LABELS[propName]) return PROP_LABELS[propName];
  // camelCase → "Camel Case"
  const spaced = propName.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const TEXT_PATH_PATTERN =
  /^(body_blocks\[\d+\]\.(title|description|cta)|free_top_text|nicky_quote\.(quote|response)|subject_variant\.(subject|preheader)|sms)$/;

const MULTILINE_PATTERNS: RegExp[] = [
  /\.description$/,
  /^nicky_quote\.quote$/,
  /^sms$/,
];

function isTextPath(path: string): boolean {
  return TEXT_PATH_PATTERN.test(path);
}

function isMultilinePath(path: string): boolean {
  return MULTILINE_PATTERNS.some((p) => p.test(path));
}

/**
 * Maps a click target back to the skeleton block that owns it.
 * Uses exact-equal matching on bind values so body_blocks[1] doesn't
 * accidentally match body_blocks[10].
 */
export function targetToBlockIndex(
  skeleton: SkeletonManifest,
  target: string,
): number | null {
  if (target.startsWith("bg:block:")) {
    const idx = parseInt(target.slice("bg:block:".length), 10);
    return Number.isNaN(idx) ? null : idx;
  }

  let bindPath: string | null = null;
  if (target.startsWith("text:")) {
    bindPath = target.slice("text:".length);
  } else if (target.startsWith("image:asset:")) {
    bindPath = "assets." + target.slice("image:asset:".length);
  } else {
    return null;
  }

  for (let i = 0; i < skeleton.blocks.length; i++) {
    const block = skeleton.blocks[i];
    for (const value of Object.values(block.bind)) {
      if (typeof value === "string" && value === bindPath) return i;
    }
  }
  return null;
}

/**
 * Lists the editable fields for a single block. Walks block.bind, drops
 * literals + the products binding, and always appends a bg field
 * (background is editable on every block per the renderer).
 */
export function resolveBlockProperties(
  skeleton: SkeletonManifest,
  blockIndex: number,
): PropField[] {
  const block = skeleton.blocks[blockIndex];
  if (!block) return [];

  const fields: PropField[] = [];

  for (const [propName, bindValue] of Object.entries(block.bind)) {
    if (typeof bindValue !== "string") continue;
    if (bindValue.startsWith("literal:")) continue;
    if (bindValue === "products") continue;

    if (bindValue.startsWith("assets.")) {
      const slotKey = bindValue.slice("assets.".length);
      fields.push({
        kind: "image:asset",
        propName,
        label: propLabel(propName),
        slotKey,
      });
      continue;
    }

    if (isTextPath(bindValue)) {
      fields.push({
        kind: "text",
        propName,
        label: propLabel(propName),
        path: bindValue,
        multiline: isMultilinePath(bindValue),
      });
    }
  }

  fields.push({ kind: "bg", label: "Background", blockIndex });

  return fields;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/modules/campaigns/utils/block-properties.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/campaigns/utils/block-properties.ts \
        src/modules/campaigns/utils/block-properties.test.ts
git commit -m "$(cat <<'EOF'
feat(design-step): add block-properties util for layers/properties panels

Maps editable bind paths in a skeleton manifest to typed PropField
descriptors the new properties panel can render directly. Includes
targetToBlockIndex for matching iframe click events to skeleton blocks.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create `LayersPanel`

**Files:**
- Create: `src/modules/campaigns/components/design-step/layers-panel.tsx`

Static, presentational component. No tests — exercised via type-check + manual verification.

- [ ] **Step 1: Implement `layers-panel.tsx`**

```tsx
// src/modules/campaigns/components/design-step/layers-panel.tsx
"use client";

import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { BLOCK_TYPE_LABELS } from "@/modules/campaigns/utils/block-properties";

interface Props {
  skeleton: SkeletonManifest;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

// Left rail of the design editor. Lists every block in the chosen
// skeleton; the active row visually pairs with the selection state held
// by DesignStepView. Drag handle icon is decorative — drag-reorder is
// out of scope for v1 (matches the "internal QA" implementation order
// in the brief).
export function LayersPanel({ skeleton, selectedIndex, onSelect }: Props) {
  return (
    <aside className="w-[180px] shrink-0 border-r border-border bg-surface px-3 py-4">
      <h2 className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Sections
      </h2>
      <ul className="space-y-1">
        {skeleton.blocks.map((block, i) => {
          const active = selectedIndex === i;
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-ink-2 hover:bg-surface-2",
                )}
              >
                <GripVertical
                  className="size-3.5 shrink-0 opacity-50"
                  aria-hidden
                />
                <span className="truncate">{BLOCK_TYPE_LABELS[block.type]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => toast.info("Adding sections is coming soon.")}
        className="mt-3 px-2 text-xs font-medium text-brand hover:underline"
      >
        + Add section
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/campaigns/components/design-step/layers-panel.tsx
git commit -m "$(cat <<'EOF'
feat(design-step): add layers panel

Left rail of the Step 5 design editor. Lists every block in the chosen
skeleton with friendly labels and a selection state.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create `DesignCanvas`

**Files:**
- Create: `src/modules/campaigns/components/design-step/design-canvas.tsx`

Iframe wrapper that hosts the editable email HTML, listens for `theograce:edit` postMessages, and renders the active selection outline.

- [ ] **Step 1: Implement `design-canvas.tsx`**

```tsx
// src/modules/campaigns/components/design-step/design-canvas.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface CanvasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  campaignId: string;
  editableHtml: string;
  selectedRect: CanvasRect | null;
  onBlockSelect: (target: string, rect: CanvasRect) => void;
}

// Center column of the design editor. Renders the editable email
// inside an auto-sized iframe (same srcDoc trick EditableEmailFrame
// uses) and overlays a 2px brand-coloured selection outline at the
// last-clicked rect. The iframe sends `theograce:edit` postMessages
// from the renderer's existing inline script — we listen, decode, and
// hand the click off to the parent state owner.
export function DesignCanvas({
  campaignId,
  editableHtml,
  selectedRect,
  onBlockSelect,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(900);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      const doc = iframe.contentWindow.document;
      setContentHeight(
        Math.max(900, doc.documentElement.scrollHeight, doc.body.scrollHeight),
      );
    } catch {
      // srcDoc is same-origin — won't happen in practice.
    }
  }, []);

  useEffect(() => {
    function handler(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "theograce:edit") return;
      const r = data.rect as CanvasRect | undefined;
      if (!r) return;
      onBlockSelect(data.target as string, r);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onBlockSelect]);

  return (
    <div className="flex flex-1 justify-center overflow-y-auto bg-surface-2 px-6 py-10">
      <div className="relative shadow-xl">
        <iframe
          ref={iframeRef}
          title={`design-${campaignId}`}
          srcDoc={editableHtml}
          scrolling="no"
          onLoad={measure}
          style={{ height: `${contentHeight}px` }}
          className="block w-[640px] bg-white"
        />
        {selectedRect ? (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: `${selectedRect.x}px`,
              top: `${selectedRect.y}px`,
              width: `${selectedRect.w}px`,
              height: `${selectedRect.h}px`,
              outline: "2px solid var(--brand)",
              outlineOffset: "2px",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/campaigns/components/design-step/design-canvas.tsx
git commit -m "$(cat <<'EOF'
feat(design-step): add design canvas

Center column of the Step 5 editor. Hosts the editable email iframe
(reusing the renderer's existing postMessage protocol) and overlays a
brand-coloured selection outline on the last-clicked block.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create `PropertiesPanel`

**Files:**
- Create: `src/modules/campaigns/components/design-step/properties-panel.tsx`

Renders the editable fields for the selected block plus a static AI suggestion card.

- [ ] **Step 1: Implement `properties-panel.tsx`**

```tsx
// src/modules/campaigns/components/design-step/properties-panel.tsx
"use client";

import { Sparkles } from "lucide-react";
import type { Campaign } from "@/lib/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import {
  BLOCK_TYPE_LABELS,
  resolveBlockProperties,
} from "@/modules/campaigns/utils/block-properties";
import { TextEditor } from "../edit-fields/text-editor";
import { ImageEditor } from "../edit-fields/image-editor";
import { BackgroundEditor } from "../edit-fields/background-editor";

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  selectedIndex: number | null;
  onSaving: () => void;
  onSaved: () => void;
}

// Right rail of the design editor. Empty-state when nothing is selected;
// otherwise lists the editable fields for the selected block. Each field
// component already speaks the fine-tune endpoints and toasts on its
// own — this panel just plumbs the saving/saved callbacks up to
// DesignStepView so the action bar's pill can show progress.
export function PropertiesPanel({
  campaign,
  skeleton,
  selectedIndex,
  onSaving,
  onSaved,
}: Props) {
  if (selectedIndex === null) {
    return (
      <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Selected
        </h2>
        <p className="text-xs text-ink-3">Click a block to edit it.</p>
      </aside>
    );
  }

  const block = skeleton.blocks[selectedIndex];
  if (!block) return null;
  const fields = resolveBlockProperties(skeleton, selectedIndex);

  return (
    <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
      <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Selected
      </h2>
      <p className="mb-4 text-sm font-semibold text-ink">
        {BLOCK_TYPE_LABELS[block.type]}
      </p>

      <div className="space-y-5">
        {fields.map((field, i) => {
          if (field.kind === "text") {
            return (
              <FieldGroup key={i} label={field.label}>
                <TextEditor
                  path={field.path}
                  multiline={field.multiline}
                  campaign={campaign}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          if (field.kind === "image:asset") {
            const currentUrl = campaign.assetPaths?.[field.slotKey] ?? null;
            return (
              <FieldGroup key={i} label={field.label}>
                {currentUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUrl}
                    alt=""
                    className="mb-2 h-20 w-full rounded object-cover"
                  />
                ) : null}
                <ImageEditor
                  title={`Replace · ${field.slotKey}`}
                  endpoint={`/api/campaigns/${campaign.id}/fine-tune/asset`}
                  formData={{ slotKey: field.slotKey }}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          if (field.kind === "bg") {
            const currentBg =
              (campaign.blockOverrides?.[field.blockIndex]?.background as
                | string
                | undefined) ?? null;
            return (
              <FieldGroup key={i} label={field.label}>
                <BackgroundEditor
                  campaignId={campaign.id}
                  blockIndex={field.blockIndex}
                  currentBackground={currentBg}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          return null;
        })}
      </div>

      <div className="mt-6 rounded-md bg-brand-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
          <Sparkles className="size-3" aria-hidden /> Suggestions
        </p>
        <p className="mt-1 text-xs text-ink-3">
          Suggestions are coming soon.
        </p>
      </div>
    </aside>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-2">{label}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/campaigns/components/design-step/properties-panel.tsx
git commit -m "$(cat <<'EOF'
feat(design-step): add properties panel

Right rail of the Step 5 editor. Renders the resolved editable fields
for the selected block by composing the extracted edit-field components.
Saving/saved callbacks are forwarded to DesignStepView so the action
bar can surface progress.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create `DesignActionBar`

**Files:**
- Create: `src/modules/campaigns/components/design-step/design-action-bar.tsx`

Sticky bottom bar with Back, saving indicator, Send test (toast stub), and Preview link.

- [ ] **Step 1: Implement `design-action-bar.tsx`**

```tsx
// src/modules/campaigns/components/design-step/design-action-bar.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { variantSlug } from "@/modules/campaigns/utils/variant-slug";

export type SavingState = "idle" | "saving" | "saved";

interface Props {
  campaignId: string;
  skeletonId: string;
  savingState: SavingState;
}

// Sticky footer for Step 5. Three regions: Back (left), saving pill
// (center), Send test + Preview (right). Send for approval is
// intentionally absent per product direction.
export function DesignActionBar({ campaignId, skeletonId, savingState }: Props) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6 sm:px-8">
        <Link
          href={`/campaigns/${campaignId}/images`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>

        <div className="mx-auto">
          <SavingPill state={savingState} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Test sends are coming soon.")}
          >
            Send test
          </Button>
          <Link
            href={`/campaigns/${campaignId}/preview/${variantSlug(skeletonId)}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="size-3.5" />
            Preview
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SavingPill({ state }: { state: SavingState }) {
  if (state === "idle") return null;
  const isSaved = state === "saved";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      <span
        className={cn(
          "size-1.5 rounded-full",
          isSaved ? "bg-success" : "bg-warning",
        )}
        aria-hidden
      />
      {isSaved ? "Saved · auto" : "Saving…"}
    </span>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/campaigns/components/design-step/design-action-bar.tsx
git commit -m "$(cat <<'EOF'
feat(design-step): add bottom action bar

Sticky footer for Step 5. Back link to /images, saving pill, Send-test
toast stub, and Preview link to the existing /preview/<slug> route.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create `DesignStepView`

**Files:**
- Create: `src/modules/campaigns/components/design-step/design-step-view.tsx`

The state owner: wires the three panels + action bar, owns selection and saving state.

- [ ] **Step 1: Implement `design-step-view.tsx`**

```tsx
// src/modules/campaigns/components/design-step/design-step-view.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { targetToBlockIndex } from "@/modules/campaigns/utils/block-properties";
import { LayersPanel } from "./layers-panel";
import { DesignCanvas, type CanvasRect } from "./design-canvas";
import { PropertiesPanel } from "./properties-panel";
import { DesignActionBar, type SavingState } from "./design-action-bar";

interface SelectedBlock {
  index: number;
  target: string | null;
  rect: CanvasRect | null;
}

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  editableHtml: string;
}

export function DesignStepView({ campaign, skeleton, editableHtml }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedBlock | null>(null);
  const [savingState, setSavingState] = useState<SavingState>("saved");
  const lastHtmlRef = useRef(editableHtml);

  // The iframe re-mounts when editableHtml changes (after a save). The
  // rect we captured at click time is stale at that point — clear it
  // (keep the index so the layers/properties panel selection persists)
  // until the next click.
  useEffect(() => {
    if (lastHtmlRef.current !== editableHtml) {
      lastHtmlRef.current = editableHtml;
      setSelected((prev) =>
        prev ? { ...prev, rect: null, target: null } : null,
      );
    }
  }, [editableHtml]);

  const handleCanvasSelect = useCallback(
    (target: string, rect: CanvasRect) => {
      const idx = targetToBlockIndex(skeleton, target);
      if (idx === null) return;
      setSelected({ index: idx, target, rect });
    },
    [skeleton],
  );

  const handleLayerSelect = useCallback((index: number) => {
    setSelected({ index, target: null, rect: null });
  }, []);

  const handleSaving = useCallback(() => {
    setSavingState("saving");
  }, []);

  const handleSaved = useCallback(() => {
    setSavingState("saved");
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1">
        <LayersPanel
          skeleton={skeleton}
          selectedIndex={selected?.index ?? null}
          onSelect={handleLayerSelect}
        />
        <DesignCanvas
          campaignId={campaign.id}
          editableHtml={editableHtml}
          selectedRect={selected?.rect ?? null}
          onBlockSelect={handleCanvasSelect}
        />
        <PropertiesPanel
          campaign={campaign}
          skeleton={skeleton}
          selectedIndex={selected?.index ?? null}
          onSaving={handleSaving}
          onSaved={handleSaved}
        />
      </div>
      <DesignActionBar
        campaignId={campaign.id}
        skeletonId={skeleton.id}
        savingState={savingState}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/campaigns/components/design-step/design-step-view.tsx
git commit -m "$(cat <<'EOF'
feat(design-step): wire up the three-column design view

DesignStepView owns the selection + saving state and connects the
layers panel, canvas, properties panel, and action bar. Iframe-only
selection (Option A): canvas postMessages drive panel state, layer
clicks set the index without an outline overlay.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create the route page

**Files:**
- Create: `src/app/campaigns/[id]/design/page.tsx`

Server component. Loads the campaign, validates it has the required state (chosen skeleton + approved copy + approved products + render result), renders the chrome and `DesignStepView`. Redirects to `/campaigns/[id]` if the campaign isn't ready (the existing detail page handles every other state).

- [ ] **Step 1: Implement `page.tsx`**

```tsx
// src/app/campaigns/[id]/design/page.tsx
import { notFound, redirect } from "next/navigation";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { DesignStepView } from "@/modules/campaigns/components/design-step/design-step-view";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { renderEditableForCampaign } from "@/modules/campaigns/utils/render-editable";
import { loadSkeletonById } from "@/modules/email-templates";

// Step 5 of the wizard. The route assumes the campaign is past asset
// upload + final render — that's the polish-the-design moment in the
// flow. Anything earlier in the lifecycle is bounced back to the
// existing /campaigns/[id] detail view, which knows every other status.
export const dynamic = "force-dynamic";

export default async function DesignStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  if (
    !campaign.chosenSkeletonId ||
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.renderResult
  ) {
    redirect(`/campaigns/${id}`);
  }

  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) redirect(`/campaigns/${id}`);

  const editableHtml = await renderEditableForCampaign(campaign);
  if (!editableHtml) redirect(`/campaigns/${id}`);

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

- [ ] **Step 2: Verify the route compiles**

Run: `npm run typecheck`
Expected: clean.

Run: `npm run build`
Expected: clean (Next.js compiles the new route without errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/campaigns/[id]/design/page.tsx
git commit -m "$(cat <<'EOF'
feat(campaigns): add /campaigns/[id]/design route (wizard Step 5)

Server component that guards the campaign state, loads the chosen
skeleton, renders the editable HTML, and hands off to DesignStepView.
Existing /campaigns/[id] flow is untouched — anything not ready for
the polish step bounces back to it.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full type-check**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 2: Full test suite**

Run: `npm run test:run`
Expected: clean. New `block-properties.test.ts` passes. All previously-passing tests still pass.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean. The new route appears in the build output.

- [ ] **Step 4: Manual smoke test**

In the dev DB (`prisma studio` if needed), find a campaign in `completed` status with a `chosenSkeletonId`, `renderResult`, `approvedCopy`, and `approvedProducts`.

1. Run: `npm run dev`
2. Visit `http://localhost:3000/campaigns/<id>/design`
3. Verify three columns render: layers (left), canvas (center, with rendered email), properties (right with empty-state message).
4. Click a block in the canvas → expect: layers panel highlights it, accent outline appears around the clicked element, properties panel shows the right fields (text inputs for copy fields, file picker for images, swatches for background).
5. Click a block in the layers panel → expect: properties panel updates, no outline overlay (until next canvas click).
6. Edit a text field → click "Save & Re-render" → expect: action bar pill flips to "Saving…", then "Saved · auto" within ~500 ms; iframe re-renders with the new text; outline disappears (rect cleared).
7. Click "Preview" in the action bar → expect: opens `/campaigns/<id>/preview/<slug>` in a new tab.
8. Click "Back" → expect: navigates to `/campaigns/<id>/images` (which 404s today — that's expected, the route is owned by Step 4 work).
9. Verify the existing `/campaigns/<id>` page still works untouched (the click-to-edit popover on the completed view still opens, edits still save).

If any step fails, fix the underlying issue and re-test from step 1.

---

## Self-review notes

**Spec coverage:**
- Route + guard → Task 10. ✓
- Three-column shell → Task 9 (`DesignStepView`). ✓
- LayersPanel → Task 5. ✓
- DesignCanvas (iframe + outline overlay + postMessage listener) → Task 6. ✓
- PropertiesPanel (with all three field types + AI suggestion card) → Task 7. ✓
- DesignActionBar (Back / saving pill / Send test / Preview, no Send-for-approval) → Task 8. ✓
- block-properties util (BLOCK_TYPE_LABELS, propLabel, targetToBlockIndex, resolveBlockProperties) + tests → Task 4. ✓
- edit-fields extraction (path-helpers, short-error, three editors with optional `onSaving`) → Tasks 1–2. ✓
- variant-slug extraction → Task 3. ✓
- Save loop using existing fine-tune endpoints → Tasks 2 + 7 + 9 (no new endpoints). ✓
- Selection rect clearing on `editableHtml` change → Task 9 (`useEffect` watching `lastHtmlRef`). ✓

**Type consistency:**
- `PropField` shape declared in Task 4 matches consumption in Task 7. `kind: "image:asset"` carries `slotKey`; `kind: "bg"` carries `blockIndex`; `kind: "text"` carries `path` + `multiline`.
- `CanvasRect` exported from Task 6 imported into Task 9.
- `SavingState` exported from Task 8 imported into Task 9.
- `targetToBlockIndex` declared in Task 4 (`(skeleton, target) => number | null`) matches Task 9 usage.

**No placeholders:** every code block is complete and ready to type-check; all commands have expected outputs; no "TBD" / "TODO" left in.
