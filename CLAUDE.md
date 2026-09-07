# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project

Task Handler — a task manager for a small dev team. Tasks nest into subtasks of
arbitrary depth; effort estimates roll up through the hierarchy. Monorepo:

- `api/` — NestJS 11 + Prisma 6 + PostgreSQL. REST API under `/api`.
- `web/` — React 19 + Vite + TanStack Query. SPA, talks to `/api`.
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
- Effort bucket semantics (not started / in progress / blocked / completed) are
  documented in `effort.ts` and `README.md`. Changing them means updating both
  plus the tests.

## Commands

```bash
# Full stack
docker compose up --build

# API (from api/)
npm run start:dev            # watch mode, needs db up + .env
npm test                     # unit tests (domain) — no db needed
npm run test:e2e             # e2e — needs db + migrations applied
npm run lint
npx prisma migrate dev --name <name>   # after editing schema.prisma

# Web (from web/)
npm run dev                  # :5173, proxies /api to :3000
npm run build                # tsc -b && vite build
```

## Conventions

- TypeScript strict-ish; `web/` uses `verbatimModuleSyntax` so import types with
  `import type`.
- Prettier + ESLint (api), oxlint (web). Run lint before committing.
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

## How AI was used on this project

The whole project was built with **Claude Code** (Sonnet) driving:
scaffolding, the Prisma schema, all domain logic and its tests, the NestJS
service/controller layer, the e2e suite, the React UI, the Docker setup and this
documentation. Development was iterative — schema and domain first, tested, then
the HTTP layer, then the frontend, verified end-to-end through
`docker compose up` against a fresh database volume.

All generated code was reviewed and adjusted by the author; correctness and
consistency are the author's responsibility.
