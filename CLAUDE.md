@AGENTS.md

---

# Email Campaign Generation — Agent Guide

Internal Theo Grace tool that automates email-campaign creation end-to-end:
creative brief → LLM-generated copy → product selection → Figma template
fill → human review gates → completed campaign.

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
- **Product feed:** public CDN JSON (`PRODUCT_FEED_URL`, served by
  static.myka.com). Plain `fetch()` — no AWS SDK. Dev fallback reads
  `data/product-feed.fixture.json` (gitignored; see `data/README.md`).
  Hero images land in `/uploads` (gitignored, mounted volume in Docker
  when we containerize).
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
│   └── figma/
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

---

## Workflow

- **One branch per plan phase.** `phase-N-<slug>` off `main`, PR in, green
  build before merge.
- **Verification:** run `npm run typecheck`, `npm run test:run`, and `npm run build` before
  opening a PR. Never claim "done" without output you've seen.
- **Secrets:** only `.env.example` is committed; real keys live in `.env`
  (gitignored). Current state: Anthropic API key present; S3 creds +
  Postgres pending from IT.

---

## Commands

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — production build + type-check (app code only)
- `npm run typecheck` — full `tsc --noEmit` (includes test files; `next build` does not)
- `npm run test` — vitest watch mode
- `npm run test:run` — vitest single run (CI-style)
- `npx prisma migrate dev --name <name>` — create + apply a migration
- `npx prisma studio` — DB browser

---

## Known Deviations From Plan

| Plan says | We do | Why |
|---|---|---|
| Postgres from day one | SQLite in dev, Postgres later | Creds not yet available |
| Prisma (implicit latest) | Prisma 6.19 | v7 driver-adapter churn not worth phase-2 overhead |
| Next.js 15 | Next.js 16 | `create-next-app@latest` pulled 16 |
| `claude-sonnet-4-20250514` | `claude-sonnet-4-6` | Plan model is retired |
| shadcn `toast` | shadcn `sonner` | `toast` removed from current registry |
| Flat `src/components/` | Feature-module layout | Maintainability |
| Plan's TitleCase `FeedProduct` (`SKU`, `"product type"`, `"Out of Stock (Stock/OOS)"`, …) | Real shape: snake_case + singular (`sku`, `product_type`, `stock_status`, `is_active`, `image_url`, `has_perosnalization`, `num_of_inscriptions`). `image_url` read directly; no `Description` or `Shape` fields. | Inspected the real `static.myka.com/.../email-marketing.json` on 2026-04-19 — plan was written from memory |
| Plan filters only on OOS | We also drop `is_active !== "Yes"` | Real feed has inactive-but-not-OOS rows |

