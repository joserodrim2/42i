import { Link } from 'react-router-dom'
import { effortText } from '../lib/effort'
import { PRIORITY_ACCENT } from '../lib/taskStyles'
import type { TaskListItem } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'
import { TrashIcon } from './icons'

interface Props {
  task: TaskListItem
  onDelete: (task: TaskListItem) => void
}

export function TaskCard({ task, onDelete }: Props) {
  const hasSubtasks = task.subtaskCount > 0
  const pointsText = effortText(task)

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`card group relative flex flex-col gap-2.5 border-x-4 p-4 no-underline transition-shadow hover:shadow-md ${PRIORITY_ACCENT[task.priority]}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(task)
        }}
        className="absolute right-2 top-2 rounded p-1 text-muted transition-colors hover:bg-blocked/50 hover:text-blocked-fg"
        aria-label={`Delete ${task.title}`}
        title="Delete task"
      >
        <TrashIcon />
      </button>

      <div className="flex flex-wrap items-center gap-1.5 pr-7">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>

      <h3 className="line-clamp-2 font-medium text-ink group-hover:text-brand-600">
        {task.title}
      </h3>

      <div className="mt-auto flex flex-col gap-1 pt-1 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-medium text-ink">{pointsText}</span>
          {hasSubtasks && (
            <>
              <span>
                · {task.subtaskCount} subtask{task.subtaskCount > 1 ? 's' : ''}
              </span>
              <span>
                · {task.rollup.remaining}/{task.rollup.totalEstimated} left
              </span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>{task.assignee ?? 'Unassigned'}</span>
          <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  )
}
