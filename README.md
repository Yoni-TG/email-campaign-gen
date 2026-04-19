# Theo Grace — Email Campaign Generator

Internal web app that automates Theo Grace email-campaign creation end-to-end:

```
creative brief ─▶ LLM-generated copy ─▶ product selection ─▶ Figma fill ─▶ review gates ─▶ completed campaign
```

Two human quality gates sit between: copy/product review (CP1) and variant
selection (CP2). The app drives a state machine —
`draft → generating → review → hero_upload → filling_figma → variant_selection → completed` —
that decides which UI renders on the campaign detail page.

Implementation plan lives in the Obsidian vault:
`Work/raw/projects/Email Campaign Generation/implementation-plan.md`.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** · **shadcn/ui** (base-ui variant) · **sonner** for toasts
- **Prisma 6** + **SQLite** in dev (Postgres planned for prod)
- **Anthropic Claude SDK** — default model `claude-sonnet-4-6`
- **AWS S3 SDK v3** — Notch product feed
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

AWS (Notch feed), Figma, and Postgres credentials are required for later
phases but not for bootstrapping.

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
| `npx prisma studio` | Browse the DB in the browser |
| `npx prisma migrate dev --name <name>` | Create + apply a migration |

---

## Project Structure

```
src/
├── app/                     # Next.js routes (thin — delegate to modules)
│   ├── layout.tsx
│   ├── page.tsx             # campaign list (home)
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
│   └── figma/
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
draft ─┐
       ▼
   generating ──(LLM + product selection)──▶ review ──(user approves)──▶ hero_upload ──▶ filling_figma ──▶ variant_selection ──▶ completed
```

The campaign `status` column drives which view renders on `/campaigns/[id]`.

---

## Environment Variables

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection. `file:./dev.db` for SQLite dev. |
| `ANTHROPIC_API_KEY` | ✅ (Task 6+) | Claude API. |
| `CLAUDE_MODEL` | optional | Defaults to `claude-sonnet-4-6`. Override with `claude-opus-4-7` for higher quality. |
| `AWS_REGION` | Task 4+ | S3 region. |
| `AWS_ACCESS_KEY_ID` | Task 4+ | S3 access key. |
| `AWS_SECRET_ACCESS_KEY` | Task 4+ | S3 secret. |
| `S3_BUCKET_NAME` | Task 4+ | Notch feed bucket. |
| `S3_FEED_KEY` | Task 4+ | Path to the feed JSON inside the bucket. |
| `FIGMA_API_TOKEN` | Phase-1 spike | Figma REST API token. |
| `FIGMA_FILE_KEY` | Phase-1 spike | Figma file containing the templates. |

---

## Development Workflow

- **One branch per plan phase:** `phase-N-<slug>`, open a PR into `main`,
  green build before merge.
- **Verification before "done":** run `npm run build` and `npm run test:run`
  before claiming a task is complete.
- **Secrets:** only `.env.example` is committed; `.env` is gitignored.

---

## Status

| Phase | Task | Status |
|---|---|---|
| 1 | Scaffolding | ✅ merged |
| 2 | Shared types + Prisma schema | ✅ merged |
| 3 | CDN image URL utility | ⏳ next |
| 4 | Product feed service | ⏳ |
| 5 | Product selection service | ⏳ |
| 6 | Copy generation service | ⏳ |
| 7 | Figma service stub | ⏳ |
| 8 | Campaign API routes | ⏳ |
| 9 | Campaign list page | ⏳ |
| 10 | Creative seed form | ⏳ |
| 11 | Campaign detail + polling | ⏳ |
| 12 | CP1 review UI | ⏳ |
| 13 | Hero upload + Figma fill + variant selection | ⏳ |
| 14 | Completed campaign view | ⏳ |

---

## License

Internal tooling — not for public redistribution.
