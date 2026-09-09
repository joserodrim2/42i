import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Modal } from '../components/Modal'
import { EffortSummary } from '../components/EffortSummary'
import { SubtaskTree } from '../components/SubtaskTree'
import { TaskForm } from '../components/TaskForm'
import { useConfirm } from '../hooks/confirm'
import { useToast } from '../hooks/toast'
import {
  useAddSubtask,
  useDeleteTask,
  useTask,
  useUpdateTask,
} from '../hooks/useTasks'
import { ALLOWED_TRANSITIONS, type TaskNode } from '../lib/types'

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong'
const errMsgOrNull = (e: unknown) => (e instanceof Error ? e.message : null)

export function TaskDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const task = useTask(id)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [editing, setEditing] = useState(false)
  const [subtaskParent, setSubtaskParent] = useState<string | null>(null)
  const addSubtask = useAddSubtask(subtaskParent ?? id)

  if (task.isLoading) return <p className="text-muted">Loading…</p>
  if (task.isError || !task.data)
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-blocked bg-blocked px-3 py-2 text-sm text-blocked-fg">
          Task not found.
        </p>
        <Link to="/" className="text-brand-600 hover:underline">
          ← Back to all tasks
        </Link>
      </div>
    )

  const t = task.data

  function changeStatus(next: TaskNode['status']) {
    updateTask.mutate(
      { id, input: { status: next } },
      {
        onSuccess: () => toast.success(`Moved to ${next}`),
        onError: (e) => toast.error(errMsg(e)),
      },
    )
  }

  async function handleDelete(
    target: { id: string; title: string },
    isRoot: boolean,
  ) {
    const ok = await confirm({
      title: isRoot ? 'Delete this task?' : 'Delete this subtask?',
      message: `"${target.title}"${
        isRoot ? ' and every subtask under it' : ' and its subtasks'
      } will be permanently deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return

    deleteTask.mutate(target.id, {
      onSuccess: (res) => {
        toast.success(
          res.deletedCount > 1
            ? `Deleted ${res.deletedCount} tasks`
            : 'Task deleted',
        )
        if (isRoot) navigate('/')
      },
      onError: (e) => toast.error(errMsg(e)),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 text-sm text-muted">
          <Link to="/" className="text-brand-600 hover:underline">
            All tasks
          </Link>
          {t.ancestors.map((a) => (
            <span key={a.id}>
              {' / '}
              <Link to={`/tasks/${a.id}`} className="text-brand-600 hover:underline">
                {a.title}
              </Link>
            </span>
          ))}
          {' / '}
          <span>{t.title}</span>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </div>
            <div className="flex gap-1">
              <button
                className="btn"
                onClick={() => {
                  updateTask.reset()
                  setEditing(true)
                }}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => void handleDelete(t, true)}
                disabled={deleteTask.isPending}
              >
                Delete task
              </button>
            </div>
          </div>

          <h2 className="mb-1 mt-3 text-xl font-semibold">{t.title}</h2>
          <p className="mt-0 whitespace-pre-wrap text-sm">
            {t.description || <span className="text-muted">No description.</span>}
          </p>

          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span>
              {t.subtasks.length > 0
                ? `Estimate: ${t.rollup.totalEstimated} pts (rolled up)`
                : `Estimate: ${t.effort === null ? '—' : `${t.effort} pts`}`}
            </span>
            <span>Assignee: {t.assignee ?? '—'}</span>
            <span>Created {new Date(t.createdAt).toLocaleString()}</span>
            <span>Updated {new Date(t.updatedAt).toLocaleString()}</span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">Move to:</span>
            {ALLOWED_TRANSITIONS[t.status].map((next) => (
              <button
                key={next}
                className="btn btn-sm"
                disabled={updateTask.isPending}
                onClick={() => changeStatus(next)}
              >
                {next}
              </button>
            ))}
          </div>
        </div>
      </div>

      <EffortSummary
        stats={t.rollup}
        title="Effort roll-up"
        subtitle="This task and all its subtasks"
      />

      <section className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Subtasks</h3>
          <button
            className="btn"
            onClick={() => {
              addSubtask.reset()
              setSubtaskParent(id)
            }}
          >
            + Add subtask
          </button>
        </div>
        <div className="card p-3.5">
          <SubtaskTree
            nodes={t.subtasks}
            onAddSubtask={(parentId) => {
              addSubtask.reset()
              setSubtaskParent(parentId)
            }}
            onDelete={(node) => void handleDelete(node, false)}
          />
        </div>
      </section>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit task">
        <TaskForm
          mode="edit"
          initial={t}
          hasSubtasks={t.subtasks.length > 0}
          submitting={updateTask.isPending}
          error={errMsgOrNull(updateTask.error)}
          onCancel={() => setEditing(false)}
          onSubmit={(input) =>
            updateTask.mutate(
              { id, input },
              {
                onSuccess: () => {
                  setEditing(false)
                  toast.success('Task updated')
                },
              },
            )
          }
        />
      </Modal>

      <Modal
        open={subtaskParent !== null}
        onClose={() => setSubtaskParent(null)}
        title="New subtask"
      >
        <TaskForm
          mode="create"
          submitting={addSubtask.isPending}
          error={errMsgOrNull(addSubtask.error)}
          onCancel={() => setSubtaskParent(null)}
          onSubmit={(input) =>
            addSubtask.mutate(input, {
              onSuccess: () => {
                setSubtaskParent(null)
                toast.success('Subtask added')
              },
            })
          }
        />
      </Modal>
    </div>
  )
}
