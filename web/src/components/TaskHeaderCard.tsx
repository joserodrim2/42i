import { PRIORITY_ACCENT } from '../lib/taskStyles'
import { ALLOWED_TRANSITIONS, type TaskDetail, type TaskStatus } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'

interface Props {
  task: TaskDetail
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onChangeStatus: (next: TaskStatus) => void
}

export function TaskHeaderCard({ task, busy, onEdit, onDelete, onChangeStatus }: Props) {
  const hasSubtasks = task.subtasks.length > 0
  const estimate = hasSubtasks
    ? `${task.rollup.totalEstimated} pts (rolled up)`
    : task.effort === null
      ? '—'
      : `${task.effort} pts`

  return (
    <div className={`card border-x-4 p-4 ${PRIORITY_ACCENT[task.priority]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex gap-1">
          <button className="btn" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete} disabled={busy}>
            Delete task
          </button>
        </div>
      </div>

      <h2 className="mb-1 mt-3 text-xl font-semibold">{task.title}</h2>
      <p className="mt-0 whitespace-pre-wrap text-sm">
        {task.description || <span className="text-muted">No description.</span>}
      </p>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span>Estimate: {estimate}</span>
        <span>Assignee: {task.assignee ?? '—'}</span>
        <span>Created {new Date(task.createdAt).toLocaleString()}</span>
        <span>Updated {new Date(task.updatedAt).toLocaleString()}</span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">Move to:</span>
        {ALLOWED_TRANSITIONS[task.status].map((next) => (
          <button
            key={next}
            className="btn btn-sm"
            disabled={busy}
            onClick={() => onChangeStatus(next)}
          >
            {next}
          </button>
        ))}
      </div>
    </div>
  )
}
