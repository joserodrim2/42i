import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Modal } from '../components/Modal'
import { StatsBar } from '../components/StatsBar'
import { TaskForm } from '../components/TaskForm'
import { useToast } from '../hooks/toast'
import { useCreateTask, useStats, useTaskList } from '../hooks/useTasks'
import { effortLabel } from '../lib/effort'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskListQuery,
  type TaskPriority,
  type TaskStatus,
} from '../lib/types'

const SORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'effort', label: 'Points' },
  { key: 'updatedAt', label: 'Updated' },
]

const TH = 'cursor-pointer select-none px-2.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400'
const TD = 'border-b border-slate-200 px-2.5 py-2.5 align-middle'

export function TaskListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [scope, setScope] = useState<'roots' | 'all'>('roots')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)

  const query: TaskListQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status ? [status] : undefined,
      priority: priority ? [priority] : undefined,
      scope,
      sortBy,
      sortDir,
      page,
      pageSize: 10,
    }),
    [search, status, priority, scope, sortBy, sortDir, page],
  )

  const toast = useToast()
  const list = useTaskList(query)
  const stats = useStats()
  const createTask = useCreateTask()

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      {stats.data && (
        <StatsBar
          stats={stats.data}
          title="Whole team — effort points across every task and subtask"
        />
      )}

      <section className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              createTask.reset()
              setCreating(true)
            }}
          >
            + New task
          </button>
        </div>

        <div className="card p-3.5">
          <div className="flex flex-wrap gap-2">
            <input
              className="field min-w-[200px] flex-[2]"
              placeholder="Search title or description…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <select
              className="field min-w-[120px] flex-1"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TaskStatus | '')
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="field min-w-[120px] flex-1"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TaskPriority | '')
                setPage(1)
              }}
            >
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="field min-w-[120px] flex-1"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as 'roots' | 'all')
                setPage(1)
              }}
            >
              <option value="roots">Top-level tasks</option>
              <option value="all">All tasks (flat)</option>
            </select>
          </div>
        </div>

        {list.isLoading && <p className="text-slate-500">Loading tasks…</p>}
        {list.isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            Could not load tasks.
          </p>
        )}

        {list.data && (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {SORT_COLUMNS.map((col) => (
                      <th key={col.key} className={TH} onClick={() => toggleSort(col.key)}>
                        {col.label}
                        {sortBy === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                    <th className={TH}>Assignee</th>
                    <th className={TH}>Subtasks</th>
                    <th className={TH}>Remaining / total</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className={TD}>
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className={TD}>
                        <StatusBadge status={task.status} />
                      </td>
                      <td className={TD}>
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className={TD}>{effortLabel(task)}</td>
                      <td className={`${TD} text-xs text-slate-500`}>
                        {new Date(task.updatedAt).toLocaleDateString()}
                      </td>
                      <td className={TD}>{task.assignee ?? '—'}</td>
                      <td className={TD}>{task.subtaskCount}</td>
                      <td className={`${TD} text-xs`}>
                        {task.rollup.remaining} / {task.rollup.totalEstimated}
                      </td>
                    </tr>
                  ))}
                  {list.data.data.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className={`${TD} text-center text-slate-500`}
                      >
                        No tasks match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-500">
                {list.data.total} task(s) · page {list.data.page} of{' '}
                {list.data.totalPages}
              </span>
              <button
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn btn-sm"
                disabled={page >= list.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </section>

      <Modal open={creating} onClose={() => setCreating(false)} title="New task">
        <TaskForm
          mode="create"
          submitting={createTask.isPending}
          error={createTask.error instanceof Error ? createTask.error.message : null}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            createTask.mutate(input, {
              onSuccess: (created) => {
                setCreating(false)
                toast.success(`Task “${created.title}” created`)
              },
            })
          }
        />
      </Modal>
    </div>
  )
}
