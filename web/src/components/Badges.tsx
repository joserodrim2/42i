import { dueCountdown, dueDateLabel, isOverdue } from '../lib/dueDate'
import { PRIORITY_LABEL, PRIORITY_STYLE, STATUS_STYLE } from '../lib/taskStyles'
import type { TaskPriority, TaskStatus } from '../lib/types'

/** De-emphasised category prefix inside a badge, e.g. "Status:". */
function Tag({ children }: { children: string }) {
  return <span className="font-medium opacity-70">{children}</span>
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className={`badge ${s.cls}`}>
      <Tag>Status:</Tag> {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge ${PRIORITY_STYLE[priority]}`}>
      <Tag>Priority:</Tag> {PRIORITY_LABEL[priority]}
    </span>
  )
}

/**
 * Due-date countdown. Teal fill so it stands out from the pale status/priority
 * badges without borrowing an urgency colour; a ring when the date has passed.
 * No prefix — "due tomorrow" / "2d overdue" already says what it is.
 */
export function DueBadge({ dueDate }: { dueDate: string }) {
  const overdue = isOverdue(dueDate)
  return (
    <span
      className={`badge bg-due text-white ${overdue ? 'ring-2 ring-inset ring-due-strong' : ''}`}
      title={`Due ${dueDateLabel(dueDate)}`}
    >
      {dueCountdown(dueDate)}
    </span>
  )
}
