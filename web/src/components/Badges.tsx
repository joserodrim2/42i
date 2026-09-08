import type { TaskPriority, TaskStatus } from '../lib/types'

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  BACKLOG: { label: 'Backlog', cls: 'bg-backlog text-backlog-fg' },
  TODO: { label: 'To do', cls: 'bg-todo text-todo-fg' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-progress text-progress-fg' },
  IN_REVIEW: { label: 'In review', cls: 'bg-review text-review-fg' },
  DONE: { label: 'Done', cls: 'bg-done text-done-fg' },
  BLOCKED: { label: 'Blocked', cls: 'bg-blocked text-blocked-fg' },
}

const PRIORITY: Record<TaskPriority, string> = {
  LOW: 'bg-prio-low text-prio-low-fg',
  MEDIUM: 'bg-prio-medium text-prio-medium-fg',
  HIGH: 'bg-prio-high text-prio-high-fg',
  URGENT: 'bg-prio-urgent text-prio-urgent-fg',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge ${STATUS[status].cls}`}>{STATUS[status].label}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`badge ${PRIORITY[priority]}`}>{priority}</span>
}
