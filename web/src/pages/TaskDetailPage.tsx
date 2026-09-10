import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EffortSummary } from '../components/EffortSummary'
import { ArrowLeftIcon, ChevronRightIcon } from '../components/icons'
import { Modal } from '../components/Modal'
import { SubtaskTree } from '../components/SubtaskTree'
import { TaskForm } from '../components/TaskForm'
import { TaskHeaderCard } from '../components/TaskHeaderCard'
import { useConfirm } from '../hooks/confirm'
import { useToast } from '../hooks/toast'
import {
  useAddSubtask,
  useDeleteTask,
  useTask,
  useUpdateTask,
} from '../hooks/useTasks'
import { STATUS_STYLE } from '../lib/taskStyles'
import type { TaskStatus } from '../lib/types'

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

  function changeStatus(next: TaskStatus) {
    updateTask.mutate(
      { id, input: { status: next } },
      {
        onSuccess: () => toast.success(`Moved to ${STATUS_STYLE[next].label}`),
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
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-y-1 text-sm"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            <ArrowLeftIcon size={14} />
            All tasks
          </Link>
          {t.ancestors.map((a) => (
            <span key={a.id} className="inline-flex items-center">
              <ChevronRightIcon size={14} className="text-muted" />
              <Link
                to={`/tasks/${a.id}`}
                className="max-w-[16ch] truncate rounded-md px-2 py-1 text-muted transition-colors hover:bg-page hover:text-ink"
              >
                {a.title}
              </Link>
            </span>
          ))}
          <ChevronRightIcon size={14} className="text-muted" />
          <span className="px-2 py-1 font-semibold text-ink">{t.title}</span>
        </nav>

        <TaskHeaderCard
          task={t}
          busy={updateTask.isPending || deleteTask.isPending}
          onEdit={() => {
            updateTask.reset()
            setEditing(true)
          }}
          onDelete={() => void handleDelete(t, true)}
          onChangeStatus={changeStatus}
        />
      </div>

      {t.subtasks.length > 0 && (
        <EffortSummary
          stats={t.rollup}
          title="Effort roll-up"
          subtitle="Across this task and every subtask"
        />
      )}

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
