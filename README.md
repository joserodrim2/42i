# Task Handler

[![CI](https://github.com/joserodrim2/42i/actions/workflows/ci.yml/badge.svg)](https://github.com/joserodrim2/42i/actions/workflows/ci.yml)

A small web app for a development team to track, prioritise and estimate its work.
Tasks form a tree of subtasks of arbitrary depth; effort estimates roll up through
the whole hierarchy so the team can see its workload at a glance.

- **API** — NestJS + Prisma + PostgreSQL, REST, unit + e2e tests
- **Web** — React + Vite (list view, detail view, subtask tree)
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
web lint + build, and a job that boots the full `docker compose` stack and hits
the health endpoint.

**Unit tests** — 49 total: the pure domain (status lifecycle, effort rollup,
tree/cycle rules) plus the service layer with a mocked database. No database
needed:

```bash
docker compose run --rm --no-deps api npm test
```

**End-to-end tests** (full HTTP API against a real PostgreSQL):

```bash
docker compose up -d db api
docker compose run --rm api npm run test:e2e
```

<details>
<summary>Running the tests locally without Docker (Node 20+)</summary>

```bash
cd api
npm install
docker compose up -d db
cp .env.example .env
npx prisma migrate deploy
npm test          # unit tests (49 — domain + service)
npm run test:e2e  # end-to-end tests (10)
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
  **assignee**, and timestamps.
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

Effort is measured in **points on a simple 1–10 scale** (1 = trivial,
10 = very large), the same unit for every task. The API accepts an optional
integer from 0 to 10 (`0` = no effort, omit / `null` = not estimated yet);
the form offers 1–10 quick-picks.

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

### Views

- **List view** (`/`) — every top-level task with status, priority, effort,
  assignee, subtask count and its subtree's remaining/total effort; a global
  stats bar; search, status/priority filters, sortable columns and pagination.
  A "flat" scope lists every task regardless of nesting.
- **Detail view** (`/tasks/:id`) — all task fields, inline editing, guided
  status changes, the subtree effort rollup, an ancestor breadcrumb, and a
  recursive subtask tree with add / open / delete on every node.

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
| `GET` | `/tasks/:id` | One task with its full nested `subtasks`, `rollup`, `parent` and `ancestors`. |
| `POST` | `/tasks` | Create a task. Body: `title` (required), `description`, `status`, `priority`, `effort`, `assignee`, `parentId`. |
| `POST` | `/tasks/:id/subtasks` | Create a task nested under `:id`. |
| `PATCH` | `/tasks/:id` | Partial update. `effort` and `parentId` accept `null` to clear / un-nest. Status changes are checked against the lifecycle; setting `effort` on a task with subtasks is rejected. |
| `DELETE` | `/tasks/:id` | Delete the task and its subtree. Returns `{ id, deletedCount }`. |

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
        ├── pages/           TaskListPage, TaskDetailPage
        ├── components/      Badges, StatsBar, TaskForm, SubtaskTree, Modal, Toast, Confirm
        ├── hooks/           TanStack Query hooks, toast/confirm contexts
        └── lib/             API client, shared types, effort helpers
```

## Nice-to-haves included

- Responsive layout (cards/grid reflow, tables scroll on narrow screens)
- Pagination, multi-field sorting and filtering on the list endpoint and UI

## AI usage

Built with Claude Code. See [CLAUDE.md](CLAUDE.md) for the agent configuration
and how AI was used.
