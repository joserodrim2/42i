import type { EffortStats, TaskListItem, TaskNode } from '../lib/types'

let seq = 0
const nextId = () => `task-${++seq}`

export function makeStats(overrides: Partial<EffortStats> = {}): EffortStats {
  return {
    totalEstimated: 0,
    notStarted: 0,
    inProgress: 0,
    blocked: 0,
    completed: 0,
    remaining: 0,
    taskCount: 1,
    leafCount: 1,
    estimatedCount: 0,
    unestimatedCount: 0,
    ...overrides,
  }
}

export function makeNode(overrides: Partial<TaskNode> = {}): TaskNode {
  return {
    id: nextId(),
    title: 'A task',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    effort: null,
    assignee: null,
    dueDate: null,
    parentId: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    subtasks: [],
    ...overrides,
  }
}

export function makeListItem(
  overrides: Partial<TaskListItem> = {},
): TaskListItem {
  const node = makeNode(overrides)
  return {
    ...node,
    subtaskCount: overrides.subtaskCount ?? node.subtasks.length,
    rollup: overrides.rollup ?? makeStats(),
  }
}
