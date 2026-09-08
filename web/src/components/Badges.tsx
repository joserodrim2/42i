import type { TaskPriority, TaskStatus } from '../lib/types'

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  BACKLOG: { label: 'Backlog', cls: 'bg-slate-100 text-slate-600' },
  TODO: { label: 'To do', cls: 'bg-sky-100 text-sky-700' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  IN_REVIEW: { label: 'In review', cls: 'bg-violet-100 text-violet-700' },
  DONE: { label: 'Done', cls: 'bg-emerald-100 text-emerald-700' },
  BLOCKED: { label: 'Blocked', cls: 'bg-red-100 text-red-700' },
}

const PRIORITY: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-500',
  MEDIUM: 'bg-sky-100 text-sky-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-200 text-red-800',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge ${STATUS[status].cls}`}>{STATUS[status].label}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`badge ${PRIORITY[priority]}`}>{priority}</span>
}
