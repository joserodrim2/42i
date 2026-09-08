import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Modal } from '../components/Modal'
import { StatsBar } from '../components/StatsBar'
import { TaskForm } from '../components/TaskForm'
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
    <div className="stack" style={{ gap: '1.5rem' }}>
      {stats.data && (
        <StatsBar
          stats={stats.data}
          title="Whole team — effort points across every task and subtask"
        />
      )}

      <section className="stack">
        <div className="row spread">
          <h2 style={{ margin: 0 }}>Tasks</h2>
          <button className="primary" onClick={() => setCreating(true)}>
            + New task
          </button>
        </div>

        <div className="card" style={{ padding: '0.85rem' }}>
          <div className="row">
            <input
              placeholder="Search title or description…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ flex: '2 1 200px' }}
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TaskStatus | '')
                setPage(1)
              }}
              style={{ flex: '1 1 120px' }}
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TaskPriority | '')
                setPage(1)
              }}
              style={{ flex: '1 1 120px' }}
            >
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as 'roots' | 'all')
                setPage(1)
              }}
              style={{ flex: '1 1 120px' }}
            >
              <option value="roots">Top-level tasks</option>
              <option value="all">All tasks (flat)</option>
            </select>
          </div>
        </div>

        {list.isLoading && <p className="muted">Loading tasks…</p>}
        {list.isError && <p className="error">Could not load tasks.</p>}

        {list.data && (
          <>
            <div className="card table-wrap">
              <table className="tasks">
                <thead>
                  <tr>
                    {SORT_COLUMNS.map((col) => (
                      <th key={col.key} onClick={() => toggleSort(col.key)}>
                        {col.label}
                        {sortBy === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                    <th>Assignee</th>
                    <th>Subtasks</th>
                    <th>Remaining / total</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td>{effortLabel(task)}</td>
                      <td className="muted small">
                        {new Date(task.updatedAt).toLocaleDateString()}
                      </td>
                      <td>{task.assignee ?? '—'}</td>
                      <td>{task.subtaskCount}</td>
                      <td className="small">
                        {task.rollup.remaining} / {task.rollup.totalEstimated}
                      </td>
                    </tr>
                  ))}
                  {list.data.data.length === 0 && (
                    <tr>
                      <td colSpan={8} className="muted" style={{ textAlign: 'center' }}>
                        No tasks match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="muted small">
                {list.data.total} task(s) · page {list.data.page} of {list.data.totalPages}
              </span>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <button
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
          error={createTask.error ? (createTask.error as Error).message : null}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            createTask.mutate(input, { onSuccess: () => setCreating(false) })
          }
        />
      </Modal>
    </div>
  )
}
