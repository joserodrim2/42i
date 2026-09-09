import type { TaskPriority, TaskStatus } from './types'

export interface TaskFilterValue {
  search: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  scope: 'roots' | 'all'
  /** `field:direction`, e.g. `updatedAt:desc` */
  sort: string
}

export const DEFAULT_FILTERS: TaskFilterValue = {
  search: '',
  status: '',
  priority: '',
  scope: 'roots',
  sort: 'updatedAt:desc',
}

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'priority:desc', label: 'Priority (high first)' },
  { value: 'effort:desc', label: 'Points (high first)' },
]
