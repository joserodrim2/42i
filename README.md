# Task Handler

[![CI](https://github.com/joserodrim2/42i/actions/workflows/ci.yml/badge.svg)](https://github.com/joserodrim2/42i/actions/workflows/ci.yml)

A small web app for a development team to track, prioritise and estimate its work.
Tasks form a tree of subtasks of arbitrary depth; effort estimates roll up through
the whole hierarchy so the team can see its workload at a glance.

- **API** — NestJS + Prisma + PostgreSQL, REST, unit + e2e tests
- **Web** — React + Vite + Tailwind CSS (list view, detail view, subtask tree),
  component + logic tests with Vitest
- **Runs** with a single `docker compose up`

---

## Quick start

Requires Docker (Compose v2). From the repository root:

```bash
docker compose up --build
```

Then open:

| What | URL |
| ---- | --- |
| Web app | http://localhost:8080 |
| API | http://localhost:3000/api |
| API docs (Swagger UI) | http://localhost:3000/api/docs |
| API health check | http://localhost:3000/api/health |

On start the API container applies database migrations and seeds a sample task
tree. To start without sample data, set `SEED_ON_START=false` for the `api`
service in `docker-compose.yml` (or `docker compose run -e SEED_ON_START=false api`).

Stop and remove everything (including the database volume):

```bash
docker compose down -v
```

---

## Running the tests

Everything below also runs in CI on every push
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): API lint + unit + e2e,
web lint + unit + build, and a job that boots the full `docker compose` stack and
hits the health endpoint.

**API unit tests** — 51 total: the pure domain (status lifecycle, effort rollup,
tree/cycle rules) plus the service layer with a mocked database. No database
needed:

```bash
docker compose run --rm --no-deps api npm test
```

**API end-to-end tests** — 18, full HTTP API against a real PostgreSQL:

```bash
docker compose up -d db api
docker compose run --rm api npm run test:e2e
```

**Web tests** — 24, the effort and due-date helpers plus the list card, filters and effort
summary rendered with Testing Library (jsdom, no browser). The web container is a
static nginx build, so run these on the host:

```bash
cd web && npm install && npm test
```

<details>
<summary>Running the tests locally without Docker (Node 20+)</summary>

```bash
cd api
npm install
docker compose up -d db
cp .env.example .env
npx prisma migrate deploy
npm test          # unit tests (51 — domain + service)
npm run test:e2e  # end-to-end tests (18)

cd ../web
npm install
npm test          # web tests (24 — effort + due-date helpers + components)
```

</details>

> The e2e suite resets the `task` table. Re-seed sample data afterwards with
> `docker compose run --rm api npm run db:seed` (or restart the `api` container).

---

## Local development (without Docker)

```bash
# 1. database
docker compose up -d db

# 2. API  (http://localhost:3000/api)
cd api
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run start:dev

# 3. Web  (http://localhost:5173, proxies /api to :3000)
cd ../web
npm install
npm run dev
```

---

## What it does

### Task management

- Full CRUD for tasks. A task has a **title**, **description**, **status**,
  **priority**, an optional **effort** estimate, an optional free-text
  **assignee**, an optional **due date**, and timestamps.
- **Subtasks** nest to any depth via a self-relation (`parentId`). Deleting a
  task cascades to its entire subtree.
- Re-parenting is validated: a task cannot be moved under itself or one of its
  own descendants.

### Status lifecycle

```
BACKLOG ─▶ TODO ─▶ IN_PROGRESS ─▶ IN_REVIEW ─▶ DONE
   ▲        │           │             │          │
   └────────┴──── back steps ─────────┘   reopen ┘

any active state ⇄ BLOCKED
```

Only the transitions in this graph are accepted; an invalid change returns
`400`. The graph lives in `api/src/tasks/domain/task-status.ts` and the web UI
offers only the valid next states.

### Priority

`LOW · MEDIUM · HIGH · URGENT` — used for sorting and focus.

### Estimations

Effort is an optional **non-negative number** (`null` / omit = not estimated).
The API enforces only "non-negative"; the web UI presents a **1–10 point scale**
(1 = trivial, 10 = very large) as a team convention so estimates stay comparable.

**Only leaf tasks are estimated.** A task that has subtasks is estimated
implicitly by the sum of its subtree, so:

- Setting an estimate on a task that has subtasks is rejected (`400`).
- When a leaf task gains its first subtask, its own estimate is dropped
  (it becomes derived). Model overhead work as an explicit subtask.

Figures are computed over the **full subtask hierarchy** (`computeEffortStats`
in `api/src/tasks/domain/effort.ts`), counting leaf tasks only:

| Figure | Meaning |
| ------ | ------- |
| `notStarted` | sum of leaf points in `BACKLOG` + `TODO` |
| `inProgress` | sum of leaf points in `IN_PROGRESS` + `IN_REVIEW` |
| `blocked` | sum of leaf points in `BLOCKED` (started but stalled, reported apart) |
| `completed` | sum of leaf points in `DONE` |
| `remaining` | `notStarted` + `inProgress` + `blocked` |
| `totalEstimated` | sum of every leaf's points, any status |
| `leafCount` / `estimatedCount` | leaf tasks, and how many have a point value |

`GET /api/tasks/stats` returns these for the whole system; each task's detail
response returns them for that task's subtree.

### Due date

A task can carry an optional **due date** (stored as end-of-day). Cards and the
detail header show it in bold plus a teal countdown pill — `due today`,
`due in 5d`, `2d overdue` (`web/src/lib/dueDate.ts`, unit-tested). The pill
colour is deliberately unrelated to priority; a `DONE` task shows the date but
no pill.

### Progress

Cards and the detail header show a **completion percentage** — completed points
over total estimated points across the subtree (`progressPct` in
`web/src/lib/effort.ts`); hidden when nothing is estimated.

### Views

- **List view** (`/`) — an effort summary (stacked bar + breakdown over the
  whole hierarchy), then tasks as a card grid with priority side accents, a
  completion bar and a due-date pill per card; search, status / priority /
  assignee filters, a sort control, a `flat` scope and pagination. Skeleton
  placeholders cover the first load.
- **Detail view** (`/tasks/:id`) — the task header card (badges, due date +
  countdown, completion bar, inline edit, guided status changes), the subtree
  effort roll-up, an ancestor breadcrumb, and a recursive subtask tree with
  add / open / delete on every node.

Destructive actions ask for confirmation in an in-app dialog and every mutation
reports back with a toast — no native `alert` / `confirm`.

---

## API reference

Interactive docs (Swagger UI) with a "Try it out" console are served at
**http://localhost:3000/api/docs**; the OpenAPI spec is at `/api/docs-json`.

Base path: `/api`. All bodies are JSON.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/tasks` | List tasks. Query: `scope` (`roots`\|`all`), `status`, `priority` (repeat or comma-separate), `search`, `assignee`, `sortBy` (`createdAt`\|`updatedAt`\|`title`\|`priority`\|`status`\|`effort`), `sortDir` (`asc`\|`desc`), `page`, `pageSize`. Returns `{ data, page, pageSize, total, totalPages }`; each item carries `subtasks`, `subtaskCount` and `rollup`. |
| `GET` | `/tasks/stats` | Global effort figures + task counts by status. |
| `GET` | `/tasks/assignees` | Distinct assignee names currently in use (for the filter). |
| `GET` | `/tasks/:id` | One task with its full nested `subtasks`, `rollup`, `parent` and `ancestors`. |
| `POST` | `/tasks` | Create a task. Body: `title` (required), `description`, `status`, `priority`, `effort`, `assignee`, `dueDate` (ISO 8601), `parentId`. |
| `POST` | `/tasks/:id/subtasks` | Create a task nested under `:id`. |
| `PATCH` | `/tasks/:id` | Partial update. `effort`, `dueDate` and `parentId` accept `null` to clear / un-nest. Status changes are checked against the lifecycle; setting `effort` on a task with subtasks is rejected. |
| `DELETE` | `/tasks/:id` | Delete the task and its subtree. Returns `{ id, deletedCount }`. |

**Field rules** (enforced by the DTOs, shown in the Swagger schemas, and mirrored
in the web form): `title` non-blank, ≤ 200 chars (trimmed); `description` ≤ 5000;
`assignee` ≤ 120; `effort` any number ≥ 0; `dueDate` a valid ISO 8601 date (a bare
`YYYY-MM-DD` is stored as the end of that day); `search` ≤ 200; `page` ≤ 100000,
`pageSize` ≤ 100. `search` matches `%` / `_` literally.

```bash
# create a parent task, then estimated leaf subtasks under it
curl -s localhost:3000/api/tasks -H 'content-type: application/json' \
  -d '{"title":"Release v1","priority":"HIGH"}'

curl -s localhost:3000/api/tasks/<id>/subtasks -H 'content-type: application/json' \
  -d '{"title":"Write changelog","status":"TODO","effort":2}'

curl -s localhost:3000/api/tasks/stats
```

---

## Design notes

- **Business logic is framework-free.** `api/src/tasks/domain/` (status graph,
  effort aggregation, tree helpers) has no NestJS or Prisma imports, so the
  rules are unit-tested directly and fast. The service layer orchestrates the
  database around them.
- **Hierarchy** is an adjacency list (`parentId`). Subtree reads for a task's
  detail use a recursive SQL CTE (one query, any depth); list-view rollups load
  the lightweight edge set once and aggregate in memory with the same pure
  function.
- **Persistence** is PostgreSQL via Prisma. The `ON DELETE CASCADE` foreign key
  gives subtree deletes for free.
- **No auth / no external services.** `assignee` is free text. Everything runs
  from the three local containers.

## Project structure

```
.
├── docker-compose.yml       db + api + web (each with a health check)
├── .github/workflows/ci.yml
├── api/
│   ├── prisma/              schema, SQL migration, seed
│   └── src/
│       ├── tasks/
│       │   ├── domain/      pure business logic + unit tests
│       │   ├── dto/         request validation (class-validator)
│       │   ├── tasks.service.ts / tasks.service.spec.ts
│       │   └── tasks.controller.ts
│       ├── common/          Prisma exception filter
│       ├── prisma/          PrismaService module
│       └── main.ts          helmet, validation, Swagger, shutdown hooks
│   └── test/                e2e tests
└── web/
    └── src/
        ├── index.css        Tailwind + @theme palette + shared component classes
        ├── pages/           TaskListPage, TaskDetailPage
        ├── components/      Navbar, EffortSummary, TaskCard, TaskHeaderCard, TaskFilters,
        │                    Pagination, TaskForm, SubtaskTree, Badges, Modal, Skeletons,
        │                    Toast, Confirm  (+ *.test.tsx alongside)
        ├── hooks/           TanStack Query hooks, toast/confirm contexts
        ├── lib/             API client, shared types, effort + due-date + filter + style helpers
        └── test/            Vitest setup + test data factories
```

## Nice-to-haves included

- Responsive layout (cards/grid reflow, tables scroll on narrow screens)
- Pagination, multi-field sorting and filtering (status, priority, assignee,
  full-text) on the list endpoint and UI
- Loading skeletons on first paint
- Points-based completion bar on every card and the detail header
- Due-date countdown pill (`due today` / `2d overdue`), colour-independent of priority

## AI usage

Built with Claude Code. [CLAUDE.md](CLAUDE.md) is the agent configuration.
