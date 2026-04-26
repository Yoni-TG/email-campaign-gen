# Theo Grace — Email Campaign Generator

Internal web app that automates Theo Grace email-campaign creation end-to-end:

```
creative brief
  ─▶ LLM-generated copy
  ─▶ product selection
  ─▶ CP1 review (operator approves copy + products)
  ─▶ 3 candidate variants rendered from skeleton library
  ─▶ operator picks one
  ─▶ uploads required assets
  ─▶ final HTML render
  ─▶ Copy to Klaviyo
```

Two human quality gates sit between: copy/product review (CP1) and variant
selection (CP2). The app drives a state machine —
`draft → generating → review → rendering_candidates → variant_selection → asset_upload → rendering_final → completed` —
that decides which UI renders on the campaign detail page.

The rendering layer is **react-email** with a curated component library
modelled on existing Theo Grace wireframes (was Figma — see
[Known Deviations](#known-deviations-from-plan)).

Implementation plan lives in the Obsidian vault:
`Work/raw/projects/Email Campaign Generation/implementation-plan.md`.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** · **shadcn/ui** (base-ui variant) · **sonner** for toasts
- **Prisma 6** + **SQLite** in dev (Postgres planned for prod)
- **react-email** (`@react-email/components`, `@react-email/render`) — atomic
  block components rendered into final HTML for Klaviyo paste-in
- **Anthropic Claude SDK** — default model `claude-sonnet-4-6`
- **Public CDN fetch** — custom `email-marketing.json` product feed (no auth)
- **@dnd-kit** — product reordering in the review UI
- **vitest** + **@testing-library/react** — unit and component tests

---

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy the template and fill in the keys you have:

```bash
cp .env.example .env
```

Minimum to run the UI and DB:

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-…"
CLAUDE_MODEL="claude-sonnet-4-6"
```

The product feed URL is public — no credentials needed. Postgres credentials
are required for prod migration but not for bootstrapping. Figma credentials
are no longer required (the integration was replaced with react-email).

### 3. Database

```bash
npx prisma migrate dev
```

Creates `prisma/dev.db` (gitignored) and applies migrations.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build + type check |
| `npm run start` | Run the built app |
| `npm run lint` | ESLint |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run (CI) |
| `npm run typecheck` | Full `tsc --noEmit` (covers tests; `next build` does not) |
| `npx prisma studio` | Browse the DB in the browser |
| `npx prisma migrate dev --name <name>` | Create + apply a migration |
| `npx tsx scripts/preview-blocks.tsx` | Render every atomic block to `out/block-previews/` (offline mirror of `/blocks`) |
| `npx tsx scripts/preview-skeletons.ts --withAssets` | Render every skeleton to `out/skeleton-previews/` (offline mirror of `/skeletons`) |

---

## Project Structure

```
src/
├── app/                     # Next.js routes (thin — delegate to modules)
│   ├── layout.tsx
│   ├── page.tsx             # campaign list (home) + nav links to dev catalogs
│   ├── blocks/              # /blocks — dev catalog of every atomic block + variants
│   ├── skeletons/           # /skeletons — dev catalog of every skeleton, rendered
│   ├── campaigns/…          # new / [id] routes
│   └── api/…                # route handlers
├── modules/                 # feature modules — each owns its UI + logic
│   ├── campaigns/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── actions/
│   │   └── types.ts
│   ├── products/
│   ├── copy-generation/
│   └── email-templates/     # ← rendering layer (replaces the old figma module)
│       ├── blocks/          # 17 atomic React-Email components + theme tokens
│       ├── skeletons/       # 15 JSON manifests (3 per campaign type)
│       ├── renderer/        # block-registry + renderSkeleton + tests
│       ├── selection/       # selectSkeletons (rules-narrows) + LLM ranker
│       └── dev/             # shared sample data + preview definitions
├── lib/                     # cross-cutting primitives
│   ├── db.ts                # Prisma client + parseCampaign helper
│   ├── types.ts             # domain types (Campaign, Status, Seed, …)
│   └── …
├── components/ui/           # shadcn primitives (don't hand-edit)
└── content/                 # brand-guide + few-shot prompt files
```

### Structure rules

1. **Feature modules first.** Anything bigger than a primitive belongs under
   `src/modules/<feature>/`.
2. **Thin components.** No heavy business logic in JSX files — extract to
   `hooks/`, `utils/`, or `actions/`.
3. **DRY.** If logic appears twice, hoist it before writing the third copy.
4. **Routes delegate.** `src/app/.../route.ts` calls into a module action;
   it doesn't hand-roll more than ~80 lines of logic.

See [`CLAUDE.md`](./CLAUDE.md) for full conventions.

---

## State Machine

```
draft
  ▼
generating ──(LLM copy + product selection)──▶
review ──(operator approves copy + products: CP1)──▶
rendering_candidates ──(selectSkeletons → 3 × renderSkeleton)──▶
variant_selection ──(operator picks one: CP2)──▶
asset_upload ──(operator uploads required assets per chosen skeleton)──▶
rendering_final ──(renderSkeleton with assets)──▶
completed
```

The campaign `status` column drives which view renders on `/campaigns/[id]`.

---

## Email Templates

The rendering layer is its own module: [`src/modules/email-templates/`](./src/modules/email-templates/).

- **Blocks** (`blocks/`) — 17 typed atomic React-Email components: `logo_header`,
  `announcement_bar`, four hero variants (`hero_lifestyle`, `hero_product`,
  `hero_typography`, `hero_tile_graphic`), `text_block_centered`,
  `editorial_split`, four product grids (`2x2`, `3x2`, `4x1`, `magazine`),
  `nicky_quote_module`, `cta_button`, `section_label`, `closing_block`,
  `footer`. Brand tokens live in `blocks/theme.ts`.
- **Skeletons** (`skeletons/`) — 15 JSON manifests, 3 per campaign type. Each
  composes blocks via `BlockEntry[]` with `bind` paths into the
  `CampaignBlueprint`. Adding a new skeleton = a JSON file + an entry in
  `skeletons/index.ts`.
- **Renderer** (`renderer/`) — `renderSkeleton(manifest, blueprint, opts)`
  walks the manifest, resolves bind paths, and emits HTML via
  `@react-email/render`. Two phases: `withAssets:false` for the candidate
  preview (placeholder images), `withAssets:true` for the final export.
- **Selection** (`selection/`) — `selectSkeletons` filters by campaign type
  and (when the pool > 3) calls an LLM ranker that returns the top 3 with
  one-sentence rationales. The ranker is dormant in v1 (each type ships with
  exactly 3 skeletons) but tested.

### Dev catalogs

Two browsable in-app routes mirror the offline scripts:

- **`/blocks`** — every block + variant rendered in isolation (23 previews
  across 17 block types). Variants of the same block (e.g. `logo_header`
  baby-blue vs white) cluster under one heading.
- **`/skeletons`** — every skeleton rendered with sample copy + products +
  assets, grouped by campaign type. Use this to spot-check a new skeleton or
  verify a brand-tweak applied across the library.

Both pages are `force-static`. The single source of truth is
[`src/modules/email-templates/dev/`](./src/modules/email-templates/dev/) —
the offline scripts pull from there too.

---

## Environment Variables

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection. `file:./dev.db` for SQLite dev. |
| `ANTHROPIC_API_KEY` | ✅ | Claude API. Used by copy generation, product reranking, and (when active) the skeleton ranker. |
| `CLAUDE_MODEL` | optional | Defaults to `claude-sonnet-4-6`. Override with `claude-opus-4-7` for higher quality. |
| `PRODUCT_FEED_URL` | ✅ for product fetch | Public CDN URL of the custom `email-marketing.json` feed. |
| `PRODUCT_FEED_SOURCE` | optional | `remote` or `local`. If unset, inferred from `PRODUCT_FEED_URL`: set → `remote`, unset → `local`. |
| `PRODUCT_FEED_LOCAL_PATH` | optional | Path to the local feed JSON. Defaults to `data/product-feed.fixture.json` (gitignored — see `data/README.md`). |

Klaviyo API push (`KLAVIYO_API_KEY` etc.) is not yet wired — the v1 Klaviyo
handoff is paste-from-clipboard via the Copy HTML button on the completed
view.

---

## Development Workflow

- **One branch per plan phase:** `phase-N-<slug>`, open a PR into `main`,
  green build before merge. (The Figma-replacement work is the explicit
  exception — bundled into a single `feature/email-template-generation`
  branch so we can verify in isolation before announcing the swap.)
- **Verification before "done":** run `npm run typecheck`, `npm run test:run`,
  and `npm run build` before claiming a task is complete.
- **Secrets:** only `.env.example` is committed; `.env` is gitignored.

---

## Known Deviations From Plan

| Plan said | We do | Why |
|---|---|---|
| Figma integration as the rendering layer | **react-email** with a curated component library | Figma's API was the wrong fit (auth/rate-limit pain, mandatory export step, weak alignment with the eventual Klaviyo API target). HTML-native output is directly pasteable today and API-pushable tomorrow. The 15-skeleton library mirrors existing Theo Grace wireframes for brand consistency. |
| Postgres from day one | SQLite in dev, Postgres later | Creds not yet available |
| Prisma (implicit latest) | Prisma 6.19 | v7 driver-adapter churn not worth phase-2 overhead |
| Next.js 15 | Next.js 16 | `create-next-app@latest` pulled 16 |
| `claude-sonnet-4-20250514` | `claude-sonnet-4-6` | Plan model is retired |
| shadcn `toast` | shadcn `sonner` | `toast` removed from current registry |
| Flat `src/components/` | Feature-module layout | Maintainability |
| Plan's TitleCase `FeedProduct` field names | snake_case + singular (`sku`, `product_type`, `stock_status`, `is_active`, `image_url`, `has_perosnalization`, `num_of_inscriptions`); `image_url` read directly | Inspected the real `static.myka.com/.../email-marketing.json` on 2026-04-19 — plan was written from memory |
| Plan filters only on OOS | We also drop `is_active !== "Yes"` | Real feed has inactive-but-not-OOS rows |
| Operator uploads hero before variant render | Operator picks variant *first*, then uploads assets the chosen skeleton declares | Skeletons need different assets — Mystery Sale is graphic-led, photo-overlay needs a hero, gift-guide may want a closing image too. Asset slots are declarative on the manifest. |
| `figma_result`, `hero_image_path` columns | `render_result`, `candidate_variants`, `chosen_skeleton_id`, `asset_paths` | Schema refactored as part of the react-email swap. `hero_image_path` is kept as a legacy nullable column until Phase 4 cleanup. |

---

## License

Internal tooling — not for public redistribution.
