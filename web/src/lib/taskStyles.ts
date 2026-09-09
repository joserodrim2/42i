import type { ScheduleState } from './schedule'
import type { TaskPriority, TaskStatus } from './types'

/** Badge surface + text classes per status (palette tokens from index.css). */
export const STATUS_STYLE: Record<TaskStatus, { label: string; cls: string }> = {
  BACKLOG: { label: 'Backlog', cls: 'bg-backlog text-backlog-fg' },
  TODO: { label: 'To do', cls: 'bg-todo text-todo-fg' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-progress text-progress-fg' },
  IN_REVIEW: { label: 'In review', cls: 'bg-review text-review-fg' },
  DONE: { label: 'Done', cls: 'bg-done text-done-fg' },
  BLOCKED: { label: 'Blocked', cls: 'bg-blocked text-blocked-fg' },
}

/** Human label per priority — use everywhere instead of the raw enum. */
export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW: 'bg-prio-low text-prio-low-fg',
  MEDIUM: 'bg-prio-medium text-prio-medium-fg',
  HIGH: 'bg-prio-high text-prio-high-fg',
  URGENT: 'bg-prio-urgent text-prio-urgent-fg',
}

/** Side-border accent used to colour a card by its priority (pair with `border-x-4`). */
export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  LOW: 'border-x-prio-low-fg',
  MEDIUM: 'border-x-prio-medium-fg',
  HIGH: 'border-x-prio-high-fg',
  URGENT: 'border-x-prio-urgent-fg',
}

/** Pale background tint a card takes from how much of its due window is left. */
export const SCHEDULE_TINT: Record<ScheduleState, string> = {
  none: '',
  early: 'bg-sched-early',
  mid: 'bg-sched-mid',
  late: 'bg-sched-late',
  overdue: 'bg-sched-overdue',
}

/** Strong pill colour for the same schedule state (badge showing the countdown). */
export const SCHEDULE_PILL: Record<ScheduleState, string> = {
  none: '',
  early: 'bg-sched-early-fg text-white',
  mid: 'bg-sched-mid-fg text-white',
  late: 'bg-sched-late-fg text-white',
  overdue: 'bg-sched-overdue-fg text-white',
}
