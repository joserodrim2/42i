import { useMemo, useState } from 'react'
import { EffortSummary } from '../components/EffortSummary'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters } from '../components/TaskFilters'
import { TaskForm } from '../components/TaskForm'
import { useConfirm } from '../hooks/confirm'
import { useToast } from '../hooks/toast'
import {
  useCreateTask,
  useDeleteTask,
  useStats,
  useTaskList,
} from '../hooks/useTasks'
import { DEFAULT_FILTERS, type TaskFilterValue } from '../lib/taskFilters'
import type { TaskListItem, TaskListQuery } from '../lib/types'

const PAGE_SIZE = 12
const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong'

export function TaskListPage() {
  const [filters, setFilters] = useState<TaskFilterValue>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)

  const patchFilters = (patch: Partial<TaskFilterValue>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const query: TaskListQuery = useMemo(() => {
    const [sortBy, sortDir] = filters.sort.split(':') as [string, 'asc' | 'desc']
    return {
      search: filters.search.trim() || undefined,
      status: filters.status ? [filters.status] : undefined,
      priority: filters.priority ? [filters.priority] : undefined,
      scope: filters.scope,
      sortBy,
      sortDir,
      page,
      pageSize: PAGE_SIZE,
    }
  }, [filters, page])

  const toast = useToast()
  const confirm = useConfirm()
  const list = useTaskList(query)
  const stats = useStats()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()

  async function handleDelete(task: TaskListItem) {
    const ok = await confirm({
      title: 'Delete this task?',
      message: `"${task.title}"${
        task.subtaskCount > 0
          ? ` and its ${task.subtaskCount} subtask${task.subtaskCount > 1 ? 's' : ''}`
          : ''
      } will be permanently deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return

    deleteTask.mutate(task.id, {
      onSuccess: (res) =>
        toast.success(
          res.deletedCount > 1
            ? `Deleted ${res.deletedCount} tasks`
            : 'Task deleted',
        ),
      onError: (e) => toast.error(errMsg(e)),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {stats.data && (
        <EffortSummary
          stats={stats.data}
          title="Effort summary"
          subtitle="Story points across every task and subtask"
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

        <TaskFilters value={filters} onChange={patchFilters} />

        {list.isLoading && <p className="text-muted">Loading tasks…</p>}
        {list.isError && (
          <p className="rounded-lg border border-blocked bg-blocked px-3 py-2 text-sm text-blocked-fg">
            Could not load tasks.
          </p>
        )}

        {list.data &&
          (list.data.data.length === 0 ? (
            <p className="card p-8 text-center text-muted">
              No tasks match these filters.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.data.data.map((task) => (
                  <TaskCard key={task.id} task={task} onDelete={handleDelete} />
                ))}
              </div>
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                total={list.data.total}
                onPage={setPage}
              />
            </>
          ))}
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
