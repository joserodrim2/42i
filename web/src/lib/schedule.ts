import type { TaskStatus } from './types'

export type ScheduleState = 'none' | 'early' | 'mid' | 'late' | 'overdue'

const DAY = 86_400_000

export interface Schedule {
  state: ScheduleState
  /** Whole days until the due date; negative once overdue. `null` with no due date. */
  daysLeft: number | null
}

type Dated = { createdAt: string; dueDate: string | null; status: TaskStatus }

/**
 * Where a task sits inside its own created → due window: first third is `early`,
 * second `mid`, last `late`, past the date `overdue`. A DONE task is never
 * flagged (`none`) — it's finished, it can't be running late.
 */
export function getSchedule(task: Dated, now: number = Date.now()): Schedule {
  if (!task.dueDate) return { state: 'none', daysLeft: null }

  const due = new Date(task.dueDate).getTime()
  const daysLeft = Math.round((due - now) / DAY)

  if (task.status === 'DONE') return { state: 'none', daysLeft }
  if (now >= due) return { state: 'overdue', daysLeft }

  const created = new Date(task.createdAt).getTime()
  const span = due - created
  const elapsed = span <= 0 ? 1 : (now - created) / span

  if (elapsed < 1 / 3) return { state: 'early', daysLeft }
  if (elapsed < 2 / 3) return { state: 'mid', daysLeft }
  return { state: 'late', daysLeft }
}

/** Short phrase for the schedule pill, e.g. "due in 5d", "3d overdue". */
export function scheduleLabel(task: Dated, now: number = Date.now()): string {
  const { state, daysLeft } = getSchedule(task, now)
  if (daysLeft === null) return ''
  if (state === 'overdue') return `${Math.max(1, -daysLeft)}d overdue`
  if (daysLeft <= 0) return 'due today'
  if (daysLeft === 1) return 'due tomorrow'
  if (daysLeft < 21) return `due in ${daysLeft}d`
  if (daysLeft < 60) return `due in ${Math.round(daysLeft / 7)}w`
  return `due in ${Math.round(daysLeft / 30)}mo`
}
