export const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

/**
 * Effort is measured in points on a simple 1-10 scale (1 = trivial,
 * 10 = very large). Only leaf tasks carry an estimate; a task with subtasks
 * shows the rolled-up sum of its subtree (the API enforces this).
 */
export const EFFORT_MIN = 1
export const EFFORT_MAX = 10

/**
 * Mirrors the lifecycle graph in api/src/tasks/domain/task-status.ts.
 * Used to offer only valid next states in the UI; the API enforces it too.
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  BACKLOG: ['TODO', 'BLOCKED'],
  TODO: ['IN_PROGRESS', 'BACKLOG', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'DONE', 'TODO', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'BLOCKED'],
  DONE: ['IN_PROGRESS'],
  BLOCKED: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'],
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  effort: number | null
  assignee: string | null
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface EffortStats {
  totalEstimated: number
  notStarted: number
  inProgress: number
  blocked: number
  completed: number
  remaining: number
  taskCount: number
  leafCount: number
  estimatedCount: number
  unestimatedCount: number
}

export type TaskNode = Task & { subtasks: TaskNode[] }

export interface TaskListItem extends Task {
  subtasks: TaskNode[]
  subtaskCount: number
  rollup: EffortStats
}

export interface TaskListResponse {
  data: TaskListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface TaskDetail extends TaskNode {
  rollup: EffortStats
  parent: Task | null
  ancestors: Task[]
}

export type GlobalStats = EffortStats & {
  byStatus: Record<TaskStatus, number>
}

export interface TaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  effort?: number | null
  assignee?: string | null
  parentId?: string | null
}

export interface TaskListQuery {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  search?: string
  scope?: 'roots' | 'all'
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
