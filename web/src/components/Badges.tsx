import { PRIORITY_STYLE, STATUS_STYLE } from '../lib/taskStyles'
import type { TaskPriority, TaskStatus } from '../lib/types'

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status]
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`badge ${PRIORITY_STYLE[priority]}`}>{priority}</span>
}
