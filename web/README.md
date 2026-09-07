# web

React + Vite frontend for the Task System. See the [root README](../README.md)
for the full picture.

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api -> http://localhost:3000
npm run build    # tsc -b && vite build -> dist/
npm run lint
```

The dev server proxies `/api` to `http://localhost:3000` (override with
`VITE_API_PROXY`). In Docker the app is served by nginx, which proxies `/api` to
the `api` service.

## Layout

- `src/pages/` — `TaskListPage` (list, filters, stats, pagination),
  `TaskDetailPage` (detail, edit, status transitions, subtask tree)
- `src/components/` — `Badges`, `StatsBar`, `TaskForm`, `SubtaskTree`, `Modal`
- `src/hooks/useTasks.ts` — TanStack Query queries + mutations
- `src/lib/` — `api.ts` (fetch client), `types.ts` (shared types, lifecycle graph)
