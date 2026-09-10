const DAY = 86_400_000

/** True once the due moment (end of the due day, set by the API) has passed. */
export function isOverdue(dueDate: string, now: number = Date.now()): boolean {
  return new Date(dueDate).getTime() <= now
}

/**
 * Short countdown for the due-date pill:
 * "due today" · "due tomorrow" · "due in 5d" · "due in 3w" · "2d overdue".
 */
export function dueCountdown(dueDate: string, now: number = Date.now()): string {
  const days = Math.floor((new Date(dueDate).getTime() - now) / DAY)
  if (days < 0) return `${-days}d overdue`
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  if (days < 21) return `due in ${days}d`
  if (days < 60) return `due in ${Math.round(days / 7)}w`
  return `due in ${Math.round(days / 30)}mo`
}

/** The due date as a plain calendar date, e.g. "15/10/2026". */
export function dueDateLabel(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString()
}
