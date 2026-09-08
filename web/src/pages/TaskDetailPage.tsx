import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Modal } from '../components/Modal'
import { StatsBar } from '../components/StatsBar'
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

  if (task.isLoading) return <p className="muted">Loading…</p>
  if (task.isError || !task.data)
    return (
      <div className="stack">
        <p className="error">Task not found.</p>
        <Link to="/">← Back to all tasks</Link>
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
    <div className="stack" style={{ gap: '1.5rem' }}>
      <div>
        <div className="breadcrumb">
          <Link to="/">All tasks</Link>
          {t.ancestors.map((a) => (
            <span key={a.id}>
              {' / '}
              <Link to={`/tasks/${a.id}`}>{a.title}</Link>
            </span>
          ))}
          {' / '}
          <span>{t.title}</span>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="row spread">
            <div className="row" style={{ gap: '0.5rem' }}>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </div>
            <div className="row" style={{ gap: '0.3rem' }}>
              <button
                onClick={() => {
                  updateTask.reset()
                  setEditing(true)
                }}
              >
                Edit
              </button>
              <button
                className="danger"
                onClick={() => void handleDelete(t, true)}
                disabled={deleteTask.isPending}
              >
                Delete task
              </button>
            </div>
          </div>

          <h2 style={{ margin: '0.75rem 0 0.25rem' }}>{t.title}</h2>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>
            {t.description || <span className="muted">No description.</span>}
          </p>

          <div className="row small muted" style={{ gap: '1rem' }}>
            <span>
              {t.subtasks.length > 0
                ? `Estimate: ${t.rollup.totalEstimated} pts (rolled up)`
                : `Estimate: ${t.effort === null ? '—' : `${t.effort} pts`}`}
            </span>
            <span>Assignee: {t.assignee ?? '—'}</span>
            <span>Created {new Date(t.createdAt).toLocaleString()}</span>
            <span>Updated {new Date(t.updatedAt).toLocaleString()}</span>
          </div>

          <div className="row" style={{ marginTop: '0.85rem', gap: '0.35rem' }}>
            <span className="small muted">Move to:</span>
            {ALLOWED_TRANSITIONS[t.status].map((next) => (
              <button
                key={next}
                className="small"
                disabled={updateTask.isPending}
                onClick={() => changeStatus(next)}
              >
                {next}
              </button>
            ))}
          </div>
        </div>
      </div>

      <StatsBar stats={t.rollup} title="This task + all its subtasks (effort points)" />

      <section className="stack">
        <div className="row spread">
          <h3 style={{ margin: 0 }}>Subtasks</h3>
          <button
            onClick={() => {
              addSubtask.reset()
              setSubtaskParent(id)
            }}
          >
            + Add subtask
          </button>
        </div>
        <div className="card" style={{ padding: '0.85rem' }}>
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
