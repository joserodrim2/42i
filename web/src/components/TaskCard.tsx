import { Link } from 'react-router-dom'
import { effortLabel } from '../lib/effort'
import { PRIORITY_ACCENT } from '../lib/taskStyles'
import type { TaskListItem } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'

export function TaskCard({ task }: { task: TaskListItem }) {
  const hasSubtasks = task.subtaskCount > 0
  const points = effortLabel(task)
  const pointsText =
    points === '—'
      ? 'No estimate'
      : `${points} ${!hasSubtasks && points === '1' ? 'pt' : 'pts'}`

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`card group flex flex-col gap-2.5 border-l-4 p-4 no-underline transition-shadow hover:shadow-md ${PRIORITY_ACCENT[task.priority]}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
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
