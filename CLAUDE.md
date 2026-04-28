@AGENTS.md

---

# Email Campaign Generation — Agent Guide

Internal Theo Grace tool that automates email-campaign creation end-to-end:
creative brief → LLM-generated copy → product selection → CP1 review → 3
react-email candidate variants → CP2 variant pick → asset upload → final
HTML render → Copy to Klaviyo.

The plan originally called for a Figma integration as the render layer; we
swapped that for **react-email** with a curated component library before
shipping anything Figma-touched. See [Known Deviations](#known-deviations-from-plan).

**Implementation plan (source of truth):**
`/Users/Yoni.Ra/Documents/Work/raw/projects/Email Campaign Generation/implementation-plan.md`

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, shadcn/ui (base-ui variant), `sonner` for toasts
- **DB:** Prisma 6.19 + SQLite in dev (`file:./dev.db`). JSON columns stored as
  `String`; use `parseCampaign()` from `@/lib/db` to hydrate rows into the
  typed `Campaign` domain model. **Swap to Postgres for prod** by changing
  `provider` in `prisma/schema.prisma` and flipping the `String` JSON columns
  to `Json`.
- **LLM:** `@anthropic-ai/sdk`, default model `claude-sonnet-4-6`
  (override via `CLAUDE_MODEL` env). Plan references retired
  `claude-sonnet-4-20250514` — ignore that; use current 4.x IDs.
- **Email rendering:** `react-email` + `@react-email/components` +
  `@react-email/render`. Atomic block components live in
  `src/modules/email-templates/blocks/`; skeletons (JSON manifests that
  compose blocks) live in `src/modules/email-templates/skeletons/`. The
  renderer emits HTML strings consumed by the variant-selection iframes
  and the final completed-view preview. **No Figma module any more.**
- **Product feed:** public CDN JSON (`PRODUCT_FEED_URL`, served by
  static.myka.com). Plain `fetch()` — no AWS SDK. Dev fallback reads
  `data/product-feed.fixture.json` (gitignored; see `data/README.md`).
  Operator-uploaded assets land in `/uploads/<campaignId>/<slotKey>.<ext>`
  (gitignored, mounted volume in Docker when we containerize).
- **Drag-and-drop:** `@dnd-kit` for product reordering.
- **Testing:** `vitest` + `@testing-library/react` + `jsdom`.

---

## Project Structure Conventions (IMPORTANT)

**Feature modules first.** Organize non-trivial code under
`src/modules/<feature>/` — each module owns its components, hooks, utils,
types, and server actions. Keep `src/app/` thin (routing + layout only).

```
src/
├── app/                               # Next.js routes — keep slim
│   ├── layout.tsx
│   ├── page.tsx                       # delegates to a module component
│   ├── blocks/                        # /blocks — dev catalog of every atomic block + variants
│   ├── skeletons/                     # /skeletons — dev catalog of every skeleton, rendered
│   ├── campaigns/…                    # route handlers import from modules
│   └── api/…
├── modules/
│   ├── campaigns/
│   │   ├── components/                # React components (thin, presentational)
│   │   ├── hooks/                     # useXxx — stateful/side-effectful logic
│   │   ├── utils/                     # pure helpers
│   │   ├── actions/                   # server actions + route-handler logic
│   │   └── types.ts                   # feature-local types (re-export from lib/types when shared)
│   ├── products/
│   ├── copy-generation/
│   └── email-templates/               # rendering layer (replaces the old figma module)
│       ├── blocks/                    # atomic React-Email components (typed) + theme
│       ├── skeletons/                 # JSON manifests + index loader
│       ├── renderer/                  # block-registry + renderSkeleton
│       ├── selection/                 # selectSkeletons + llm-ranker (dormant in v1)
│       └── dev/                       # shared sample data + preview definitions
├── lib/                               # cross-module primitives
│   ├── db.ts                          # Prisma singleton + parseCampaign
│   ├── types.ts                       # shared domain types (CAMPAIGN_*, Campaign, Seed, …)
│   └── <other shared>
├── components/ui/                     # shadcn primitives — don't edit unless intentional
├── content/                           # brand-guide / few-shot prompt files
└── __tests__/                         # colocated tests preferred; shared setup here
```

Plan documents use flat paths (e.g. `src/components/creative-seed-form.tsx`).
**Translate to the module layout.** Example: `creative-seed-form.tsx` lives at
`src/modules/campaigns/components/creative-seed-form.tsx`, and its validation
+ submit logic lives in `src/modules/campaigns/hooks/use-creative-seed-form.ts`.

---

## Code Rules

1. **Thin components, fat helpers.** No large business logic in React
   components. If logic is >~30 lines or is reused, extract to a hook
   (`useXxx`), util (pure fn), or server action.
2. **DRY strictly.** Same logic appearing twice = extract before writing a
   third time. Applies to form validation, API clients, status-label maps,
   JSON parse/serialize, and any formatter.
3. **Type everything at module boundaries.** API route handlers validate
   input; server actions return typed results. No `any`.
4. **JSON columns on SQLite:** writes go through `JSON.stringify`, reads go
   through `parseCampaign()` or an equivalent typed parser — never hand-parse
   in a component.
5. **No huge routes.** If `route.ts` grows past ~80 lines, move logic to
   `src/modules/<feature>/actions/`.
6. **Tests:** each `src/lib/*` or `src/modules/*/utils/*` file gets a unit
   test. Colocate as `*.test.ts` or put in `__tests__/` mirroring the source
   path.

### Email-templates rules

7. **One source of truth for block previews.** Both the `/blocks` route
   and `scripts/preview-blocks.tsx` pull from
   `src/modules/email-templates/dev/block-previews.tsx`. When you add a new
   block or variant, register it there — both surfaces update without
   further wiring.
8. **Skeletons are JSON, not TS objects.** Each lives at
   `skeletons/<campaign-type>/<id>.json` and is imported + cast to
   `SkeletonManifest` in `skeletons/index.ts`. Adding a new one = a JSON
   file + one new line in the index.
9. **Bind paths reference `CampaignBlueprint`.** Strings starting with
   `literal:` are passed through verbatim; `assets.<key>` resolves against
   the operator-uploaded asset map (placeholder during the candidate phase);
   anything else is a dotted path walked into the blueprint
   (e.g. `body_blocks[0].title`). Non-string bind values (objects, arrays)
   are inline literals.
10. **Block prop typing is enforced via `BlockPropsMap`.** Every entry in
    `BLOCK_TYPES` must have a corresponding `BlockPropsMap[T]` entry and a
    `blockRegistry[T]` component. Adding a new block = update all three —
    `BLOCK_TYPES`, `BlockPropsMap`, `blockRegistry` — and TypeScript will
    catch the omission.

---

## Workflow

- **One branch per plan phase.** `phase-N-<slug>` off `main`, PR in, green
  build before merge. The Figma-replacement work is the explicit exception
  — bundled into the single `feature/email-template-generation` branch so we
  can verify the swap in isolation before announcing it externally.
- **Verification:** run `npm run typecheck`, `npm run test:run`, and `npm run build` before
  opening a PR. Never claim "done" without output you've seen.
- **Secrets:** only `.env.example` is committed; real keys live in `.env`
  (gitignored). Current state: Anthropic API key present; Postgres pending
  from IT. Figma credentials are no longer needed.

---

## Commands

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — production build + type-check (app code only)
- `npm run typecheck` — full `tsc --noEmit` (includes test files; `next build` does not)
- `npm run test` — vitest watch mode
- `npm run test:run` — vitest single run (CI-style)
- `npx prisma migrate dev --name <name>` — create + apply a migration
- `npx prisma studio` — DB browser
- `npx tsx scripts/preview-blocks.tsx` — render every atomic block to `out/block-previews/` (offline mirror of `/blocks`)
- `npx tsx scripts/preview-skeletons.ts --withAssets` — render every skeleton to `out/skeleton-previews/` (offline mirror of `/skeletons`)

### In-app dev catalogs

- `/blocks` — every block + variant rendered in isolation, grouped by type.
  Use during design review or when adding a new block. The catalog entries
  live in `src/modules/email-templates/dev/block-previews.tsx`.
- `/skeletons` — every skeleton rendered with sample copy + products + assets,
  grouped by campaign type. Use to spot-check a new skeleton or verify a
  brand tweak applied across the library.

Both pages are `force-static` and pull from the same source of truth as the
offline scripts — `src/modules/email-templates/dev/`.

---

## Status Flow

```
draft → generating → review (CP1) →
rendering_candidates → variant_selection (CP2) →
asset_upload → rendering_final → completed
```

Each transition has a dedicated server action under
`src/modules/campaigns/actions/`:

- `approve-campaign.ts`: review → rendering_candidates
- `render-candidates.ts`: rendering_candidates → variant_selection (calls
  `selectSkeletons` + `renderSkeleton` ×3, persists `candidateVariants`)
- `select-variant.ts`: variant_selection → asset_upload (writes
  `chosenSkeletonId`)
- `upload-asset.ts`: asset_upload → asset_upload (more required slots) or
  rendering_final (all required slots filled). Asset slots are declared by
  the chosen skeleton's `requiredAssets[]`.
- `render-final.ts`: rendering_final → completed (calls `renderSkeleton`
  with assets, persists `renderResult`)

The completed view shows the rendered iframe + a Copy-HTML button for
Klaviyo paste-in. Klaviyo API push is deferred.

---

## Known Deviations From Plan

| Plan says | We do | Why |
|---|---|---|
| Figma integration as the rendering layer | **react-email** with a curated 17-block library + 15 skeleton manifests | Figma's API was the wrong fit (auth/rate-limit pain, mandatory export step, weak alignment with eventual Klaviyo API push). HTML-native output is directly pasteable today and API-ready tomorrow. The library mirrors existing Theo Grace wireframes for brand consistency. |
| `figma_result` + `hero_image_path` columns; `hero_upload` / `filling_figma` statuses | `render_result`, `candidate_variants`, `chosen_skeleton_id`, `asset_paths` columns; `rendering_candidates` / `asset_upload` / `rendering_final` statuses; `hero_image_path` kept as legacy nullable until Phase 4 cleanup | Schema refactored alongside the react-email swap. Existing dev rows had `hero_upload` / `filling_figma` mapped onto the new flow during the migration. |
| Operator uploads hero before variant render | Operator picks variant *first*, then uploads only the assets the chosen skeleton's `requiredAssets[]` declares (could be 0, 1, or 2 image slots) | Skeletons need different assets — Mystery Sale is graphic-led with no photo, photo-overlay needs a hero, gift-guide may want a closing image too. Asset slots are declarative on the manifest. |
| Postgres from day one | SQLite in dev, Postgres later | Creds not yet available |
| Prisma (implicit latest) | Prisma 6.19 | v7 driver-adapter churn not worth phase-2 overhead |
| Next.js 15 | Next.js 16 | `create-next-app@latest` pulled 16 |
| `claude-sonnet-4-20250514` | `claude-sonnet-4-6` | Plan model is retired |
| shadcn `toast` | shadcn `sonner` | `toast` removed from current registry |
| Flat `src/components/` | Feature-module layout | Maintainability |
| Plan's TitleCase `FeedProduct` (`SKU`, `"product type"`, `"Out of Stock (Stock/OOS)"`, …) | Real shape: snake_case + singular (`sku`, `product_type`, `stock_status`, `is_active`, `image_url`, `has_perosnalization`, `num_of_inscriptions`). `image_url` read directly; no `Description` or `Shape` fields. | Inspected the real `static.myka.com/.../email-marketing.json` on 2026-04-19 — plan was written from memory |
| Plan filters only on OOS | We also drop `is_active !== "Yes"` | Real feed has inactive-but-not-OOS rows |

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
