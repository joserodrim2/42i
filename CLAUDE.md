# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project

Task Handler — a task manager for a small dev team. Tasks nest into subtasks of
arbitrary depth; effort estimates roll up through the hierarchy. Monorepo:

- `api/` — NestJS 11 + Prisma 6 + PostgreSQL. REST API under `/api`.
- `web/` — React 19 + Vite + Tailwind CSS v4 + TanStack Query. SPA, talks to `/api`.
- `docker-compose.yml` — `db` + `api` + `web`, single-command startup.

## Architecture rules

- **Keep business logic in `api/src/tasks/domain/`.** These modules
  (`task-status.ts`, `effort.ts`, `tree.ts`) must stay free of NestJS and
  Prisma imports. They are pure and unit-tested directly. New business rules go
  here first, then get wired into `tasks.service.ts`.
- The **service** orchestrates persistence around the domain; the
  **controller** only does routing + validation via DTOs.
- The status lifecycle graph is defined once in `task-status.ts`. The web app
  mirrors it in `web/src/lib/types.ts` (`ALLOWED_TRANSITIONS`) — keep the two in
  sync if you change transitions.
- Effort model: **points on a 1–10 scale, leaves only**. Only leaf tasks carry an
  estimate; parents are the sum of their subtree. Enforced in `effort.ts`
  (aggregation ignores non-leaf effort) and `tasks.service.ts` (rejects
  estimating a parent; clears a leaf's estimate when it gains a subtask).
  Bucket semantics (not started / in progress / blocked / completed) live in
  `effort.ts` + `README.md`. Changing any of this means updating both plus the
  tests. `web/src/lib/effort.ts` mirrors the rollup for display (`effortText`
  is the shared "N pts" / "No estimate" wording for both the card and the
  detail header — keep them using it, don't re-format inline).

## Commands

```bash
# Full stack
docker compose up --build

# API (from api/)
npm run start:dev            # watch mode, needs db up + .env; docs at /api/docs
npm test                     # unit tests (domain + service, mocked db) — no db
npm run test:e2e             # e2e — needs db + migrations applied
npm run lint                 # check only; lint:fix to autofix
npx prisma migrate dev --name <name>   # after editing schema.prisma

# Web (from web/)
npm run dev                  # :5173, proxies /api to :3000
npm test                     # Vitest (jsdom) — effort helpers + component render
npm run build                # tsc -b && vite build
```

## Conventions

- TypeScript strict-ish; `web/` uses `verbatimModuleSyntax` so import types with
  `import type`.
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` (no config file). Shared
  primitives (`.btn*`, `.card`, `.field`, `.badge`) live in `@layer components`
  in `web/src/index.css`; everything else is utilities.
- The palette is the `@theme` block in `index.css` — semantic tokens only
  (`ink`, `brand-*`, `page`, `surface`, `line`, `muted`, `todo`/`progress`/
  `review`/…, `prio-low`/…, each with a `-fg` for its text). Use those
  exclusively — no raw `slate-*` / `red-*` / `bg-white` anywhere in `src/`.
  Status/priority → colour mapping is centralised in `lib/taskStyles.ts`
  (`STATUS_STYLE`, `PRIORITY_STYLE`, `PRIORITY_ACCENT` — the left-border tint
  cards get from their priority — and `PRIORITY_LABEL`). Never render a raw
  enum (`IN_PROGRESS`, `URGENT`): use `STATUS_STYLE[s].label` / `PRIORITY_LABEL`.
  `IN_REVIEW` uses a violet not in the supplied palette (no entry for review).
- Prettier + ESLint (api), oxlint (web). Run lint before committing.
- Web tests use Vitest + Testing Library with a standalone `vitest.config.ts`
  (jsdom, no Tailwind plugin). `.test.tsx` files are excluded from
  `tsconfig.app.json` so `npm run build` stays fast; Vitest transpiles them.
- Commit style: Conventional Commits, scoped `api` / `web` / build. Small,
  focused commits.
- Prisma model changes require a migration committed alongside them.

## Gotchas

- `api` build excludes `prisma/` and `prisma.config.ts` from `tsconfig.build.json`
  so `dist/main.js` stays at the root.
- The compose `db` publishes host port **5433** (avoids clashing with a local
  Postgres on 5432). `.env.example` matches.
- `prisma generate` must not require `DATABASE_URL`; the URL is read lazily from
  `schema.prisma`'s `env()`.
- Swagger schemas come from the `@nestjs/swagger` CLI plugin in `nest-cli.json`
  (inferred from DTOs at `nest build`/`start`; not applied under ts-jest).
- After `npm install`ing a dep on macOS the lockfile can end up missing Linux
  optional deps (`@emnapi/*`), breaking `npm ci` in Docker/CI. Fix:
  `rm -rf node_modules package-lock.json && npm install`, then re-`prisma generate`.

## How AI was used on this project

The whole project was built with **Claude Code** (Sonnet) driving:
scaffolding, the Prisma schema, all domain logic and its tests, the NestJS
service/controller layer, the e2e suite, the React UI, the Docker setup and this
documentation. Development was iterative — schema and domain first, tested, then
the HTTP layer, then the frontend, verified end-to-end through
`docker compose up` against a fresh database volume.

All generated code was reviewed and adjusted by the author; correctness and
consistency are the author's responsibility.
